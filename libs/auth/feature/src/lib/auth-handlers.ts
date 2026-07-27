import { Inject } from '@nestjs/common';
import {
  CommandHandler,
  type ICommandHandler,
  type IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  AUTH_REPOSITORY,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  PASSWORD_HASHER,
  SESSION_TOKEN_GENERATOR,
  SESSION_TOKEN_HASHER,
  UnauthenticatedError,
  normalizeEmail,
  parseLoginInput,
  parseRegistrationInput,
  toSafeUser,
  type AuthenticationResult,
  type AuthRepository,
  type Clock,
  type IdGenerator,
  type PasswordHasher,
  type SafeUser,
  type SessionTokenGenerator,
  type SessionTokenHasher,
} from '@mr-booking/auth-domain';
import {
  LoginUserCommand,
  LogoutSessionCommand,
  RegisterUserCommand,
} from './auth-commands';
import { GetCurrentUserQuery } from './auth-queries';

export const AUTH_SESSION_TTL_MILLISECONDS = Symbol(
  'AUTH_SESSION_TTL_MILLISECONDS',
);

abstract class SessionIssuingHandler {
  protected constructor(
    protected readonly repository: AuthRepository,
    protected readonly tokenGenerator: SessionTokenGenerator,
    protected readonly tokenHasher: SessionTokenHasher,
    protected readonly clock: Clock,
    protected readonly idGenerator: IdGenerator,
    protected readonly sessionTtlMilliseconds: number,
  ) {}

  protected issueSession(userId: string): {
    readonly rawSessionToken: string;
    readonly session: {
      readonly id: string;
      readonly userId: string;
      readonly tokenHash: string;
      readonly createdAtUtc: number;
      readonly expiresAtUtc: number;
    };
  } {
    const createdAtUtc = this.clock.now();
    const rawSessionToken = this.tokenGenerator.generate();

    return {
      rawSessionToken,
      session: {
        id: this.idGenerator.generate(),
        userId,
        tokenHash: this.tokenHasher.hash(rawSessionToken),
        createdAtUtc,
        expiresAtUtc: createdAtUtc + this.sessionTtlMilliseconds,
      },
    };
  }
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  extends SessionIssuingHandler
  implements ICommandHandler<RegisterUserCommand, AuthenticationResult>
{
  public constructor(
    @Inject(AUTH_REPOSITORY) repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(SESSION_TOKEN_GENERATOR) tokenGenerator: SessionTokenGenerator,
    @Inject(SESSION_TOKEN_HASHER) tokenHasher: SessionTokenHasher,
    @Inject(AUTH_CLOCK) clock: Clock,
    @Inject(AUTH_ID_GENERATOR) idGenerator: IdGenerator,
    @Inject(AUTH_SESSION_TTL_MILLISECONDS) sessionTtlMilliseconds: number,
  ) {
    super(
      repository,
      tokenGenerator,
      tokenHasher,
      clock,
      idGenerator,
      sessionTtlMilliseconds,
    );
  }

  public async execute(
    command: RegisterUserCommand,
  ): Promise<AuthenticationResult> {
    const input = parseRegistrationInput(command.input);
    const normalizedEmail = normalizeEmail(input.email);

    if (this.repository.normalizedEmailExists(normalizedEmail)) {
      throw new EmailAlreadyExistsError();
    }

    const userId = this.idGenerator.generate();
    const passwordHash = await this.passwordHasher.hash(input.password);
    const issued = this.issueSession(userId);
    const user = {
      id: userId,
      name: input.name,
      email: input.email,
      normalizedEmail,
      passwordHash,
      createdAtUtc: issued.session.createdAtUtc,
    };

    this.repository.createUserAndSession(user, issued.session);

    return {
      user: toSafeUser(user),
      rawSessionToken: issued.rawSessionToken,
      expiresAtUtc: issued.session.expiresAtUtc,
    };
  }
}

@CommandHandler(LoginUserCommand)
export class LoginUserHandler
  extends SessionIssuingHandler
  implements ICommandHandler<LoginUserCommand, AuthenticationResult>
{
  public constructor(
    @Inject(AUTH_REPOSITORY) repository: AuthRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(SESSION_TOKEN_GENERATOR) tokenGenerator: SessionTokenGenerator,
    @Inject(SESSION_TOKEN_HASHER) tokenHasher: SessionTokenHasher,
    @Inject(AUTH_CLOCK) clock: Clock,
    @Inject(AUTH_ID_GENERATOR) idGenerator: IdGenerator,
    @Inject(AUTH_SESSION_TTL_MILLISECONDS) sessionTtlMilliseconds: number,
  ) {
    super(
      repository,
      tokenGenerator,
      tokenHasher,
      clock,
      idGenerator,
      sessionTtlMilliseconds,
    );
  }

  public async execute(
    command: LoginUserCommand,
  ): Promise<AuthenticationResult> {
    const input = parseLoginInput(command.input);
    const credentials = this.repository.findUserCredentials(
      normalizeEmail(input.email),
    );

    if (
      !credentials ||
      !(await this.passwordHasher.verify(
        credentials.passwordHash,
        input.password,
      ))
    ) {
      throw new InvalidCredentialsError();
    }

    const issued = this.issueSession(credentials.id);
    this.repository.createSession(issued.session);

    return {
      user: toSafeUser(credentials),
      rawSessionToken: issued.rawSessionToken,
      expiresAtUtc: issued.session.expiresAtUtc,
    };
  }
}

@CommandHandler(LogoutSessionCommand)
export class LogoutSessionHandler implements ICommandHandler<
  LogoutSessionCommand,
  void
> {
  public constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(SESSION_TOKEN_HASHER)
    private readonly tokenHasher: SessionTokenHasher,
  ) {}

  public async execute(command: LogoutSessionCommand): Promise<void> {
    this.repository.deleteSession(
      this.tokenHasher.hash(command.rawSessionToken),
    );
  }
}

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<
  GetCurrentUserQuery,
  SafeUser
> {
  public constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(SESSION_TOKEN_HASHER)
    private readonly tokenHasher: SessionTokenHasher,
    @Inject(AUTH_CLOCK)
    private readonly clock: Clock,
  ) {}

  public async execute(query: GetCurrentUserQuery): Promise<SafeUser> {
    const user = this.repository.findActiveSessionUser(
      this.tokenHasher.hash(query.rawSessionToken),
      this.clock.now(),
    );

    if (!user) {
      throw new UnauthenticatedError();
    }

    return user;
  }
}
