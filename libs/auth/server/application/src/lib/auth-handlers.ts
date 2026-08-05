import { Inject } from '@nestjs/common';
import {
  CommandHandler,
  CommandBus,
  type ICommandHandler,
  type IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import {
  AUTH_CLOCK,
  AUTH_ID_GENERATOR,
  EMAIL_VERIFICATION_DELIVERY,
  EMAIL_VERIFICATION_TOKEN_GENERATOR,
  EMAIL_VERIFICATION_TOKEN_HASHER,
  AUTH_REPOSITORY,
  EmailAlreadyExistsError,
  EmailVerificationDeliveryFailedError,
  EmailVerificationInvalidOrExpiredError,
  EmailVerificationRateLimitedError,
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
  type EmailVerificationDelivery,
  type EmailVerificationDeliveryResult,
  type EmailVerificationResult,
  type EmailVerificationTokenGenerator,
  type EmailVerificationTokenHasher,
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
  RequestEmailVerificationCommand,
  VerifyEmailCommand,
} from './auth-commands';
import { GetCurrentUserQuery } from './auth-queries';
import type { IssuedSession } from './types/auth-handler.types';
import type { EmailVerificationConfiguration } from './types/email-verification.types';

export const AUTH_SESSION_TTL_MILLISECONDS = Symbol(
  'AUTH_SESSION_TTL_MILLISECONDS',
);
export const AUTH_EMAIL_VERIFICATION_CONFIGURATION = Symbol(
  'AUTH_EMAIL_VERIFICATION_CONFIGURATION',
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

  protected issueSession(userId: string): IssuedSession {
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
    private readonly commandBus: CommandBus,
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
      emailVerifiedAtUtc: null,
    };

    this.repository.createUserAndSession(user, issued.session);

    let emailVerification: EmailVerificationDeliveryResult;

    try {
      emailVerification = await this.commandBus.execute(
        new RequestEmailVerificationCommand(userId, command.locale, 'initial'),
      );
    } catch (error) {
      if (!(error instanceof EmailVerificationDeliveryFailedError)) {
        throw error;
      }

      emailVerification = {
        status: 'delivery-failed',
        code: error.code,
      };
    }

    return {
      user: toSafeUser(user),
      rawSessionToken: issued.rawSessionToken,
      expiresAtUtc: issued.session.expiresAtUtc,
      emailVerification,
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

@CommandHandler(RequestEmailVerificationCommand)
export class RequestEmailVerificationHandler implements ICommandHandler<
  RequestEmailVerificationCommand,
  EmailVerificationDeliveryResult
> {
  public constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(AUTH_CLOCK)
    private readonly clock: Clock,
    @Inject(AUTH_ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
    @Inject(EMAIL_VERIFICATION_TOKEN_GENERATOR)
    private readonly tokenGenerator: EmailVerificationTokenGenerator,
    @Inject(EMAIL_VERIFICATION_TOKEN_HASHER)
    private readonly tokenHasher: EmailVerificationTokenHasher,
    @Inject(EMAIL_VERIFICATION_DELIVERY)
    private readonly delivery: EmailVerificationDelivery,
    @Inject(AUTH_EMAIL_VERIFICATION_CONFIGURATION)
    private readonly configuration: EmailVerificationConfiguration,
  ) {}

  public async execute(
    command: RequestEmailVerificationCommand,
  ): Promise<EmailVerificationDeliveryResult> {
    const nowUtc = this.clock.now();
    const rawToken = this.tokenGenerator.generate();
    const issue = this.repository.withImmediateTransaction((transaction) => {
      const user = transaction.findUserById(command.authenticatedUserId);

      if (!user) {
        throw new UnauthenticatedError();
      }

      if (user.emailVerifiedAtUtc !== null) {
        return null;
      }

      const latest = transaction.findLatestEmailVerificationToken(user.id);
      const cooldownMilliseconds =
        this.configuration.resendCooldownSeconds * 1000;

      if (latest && latest.createdAtUtc + cooldownMilliseconds > nowUtc) {
        throw new EmailVerificationRateLimitedError(
          Math.ceil(
            (latest.createdAtUtc + cooldownMilliseconds - nowUtc) / 1000,
          ),
        );
      }

      const expiresAtUtc = nowUtc + this.configuration.tokenTtlMilliseconds;
      transaction.invalidateActiveEmailVerificationTokens(user.id, nowUtc);
      transaction.createEmailVerificationToken({
        id: this.idGenerator.generate(),
        userId: user.id,
        tokenHash: this.tokenHasher.hash(rawToken),
        createdAtUtc: nowUtc,
        expiresAtUtc,
      });

      return {
        user,
        expiresAtUtc,
      };
    });

    if (!issue) {
      return {
        status: 'already-verified',
        code: 'EMAIL_ALREADY_VERIFIED',
      };
    }

    const verificationUrl = buildVerificationUrl(
      this.configuration.appPublicUrl,
      command.locale,
      rawToken,
    );

    try {
      await this.delivery.sendVerificationEmail({
        userId: issue.user.id,
        email: issue.user.email,
        name: issue.user.name,
        locale: command.locale,
        verificationUrl,
        expiresAtUtc: issue.expiresAtUtc,
      });
    } catch {
      throw new EmailVerificationDeliveryFailedError();
    }

    return {
      status: 'sent',
      code: 'EMAIL_VERIFICATION_SENT',
      expiresAtUtc: new Date(issue.expiresAtUtc).toISOString(),
      retryAfterSeconds: this.configuration.resendCooldownSeconds,
      ...(this.configuration.exposeDevelopmentVerificationLink
        ? { developmentVerificationUrl: verificationUrl }
        : {}),
    };
  }
}

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<
  VerifyEmailCommand,
  EmailVerificationResult
> {
  public constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository,
    @Inject(AUTH_CLOCK)
    private readonly clock: Clock,
    @Inject(EMAIL_VERIFICATION_TOKEN_HASHER)
    private readonly tokenHasher: EmailVerificationTokenHasher,
  ) {}

  public async execute(
    command: VerifyEmailCommand,
  ): Promise<EmailVerificationResult> {
    const result = this.repository.withImmediateTransaction((transaction) =>
      transaction.consumeEmailVerificationToken(
        this.tokenHasher.hash(command.rawToken),
        this.clock.now(),
      ),
    );

    if (result === 'invalid') {
      throw new EmailVerificationInvalidOrExpiredError();
    }

    return {
      code:
        result === 'already-verified'
          ? 'EMAIL_ALREADY_VERIFIED'
          : 'EMAIL_VERIFIED',
    };
  }
}

function buildVerificationUrl(
  appPublicUrl: string,
  locale: 'uk' | 'en',
  rawToken: string,
): string {
  const baseUrl = appPublicUrl.endsWith('/')
    ? appPublicUrl.slice(0, -1)
    : appPublicUrl;
  return `${baseUrl}/${locale}/verify-email?token=${encodeURIComponent(rawToken)}`;
}
