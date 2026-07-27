import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  UnauthenticatedError,
  type AuthRepository,
  type Clock,
  type IdGenerator,
  type NewSessionRecord,
  type NewUserRecord,
  type PasswordHasher,
  type SessionTokenGenerator,
  type SessionTokenHasher,
} from '@mr-booking/auth-domain';
import {
  LoginUserCommand,
  LogoutSessionCommand,
  RegisterUserCommand,
} from './auth-commands';
import {
  GetCurrentUserHandler,
  LoginUserHandler,
  LogoutSessionHandler,
  RegisterUserHandler,
} from './auth-handlers';
import { GetCurrentUserQuery } from './auth-queries';

const sessionTtl = 7 * 24 * 60 * 60 * 1000;

describe('authentication handlers', () => {
  let repository: InMemoryAuthRepository;
  let passwordHasher: TestPasswordHasher;
  let tokenGenerator: SequenceTokenGenerator;
  let tokenHasher: SessionTokenHasher;
  let clock: MutableClock;
  let idGenerator: SequenceIdGenerator;

  beforeEach(() => {
    repository = new InMemoryAuthRepository();
    passwordHasher = new TestPasswordHasher();
    tokenGenerator = new SequenceTokenGenerator();
    tokenHasher = { hash: (token) => `hash:${token}` };
    clock = new MutableClock();
    idGenerator = new SequenceIdGenerator();
  });

  it('registers atomically and automatically authenticates the user', async () => {
    const handler = registerHandler();
    const result = await handler.execute(
      new RegisterUserCommand({
        name: ' Alice ',
        email: ' Alice@Example.com ',
        password: 'password123',
      }),
    );

    expect(result.user).toEqual({
      id: 'id-1',
      name: 'Alice',
      email: 'Alice@Example.com',
    });
    expect(result.rawSessionToken).toBe('token-1');
    expect(repository.users).toHaveLength(1);
    expect(repository.sessions).toHaveLength(1);
    expect(repository.users[0]?.passwordHash).toBe('test:password123');
    expect(repository.sessions[0]?.tokenHash).toBe('hash:token-1');
  });

  it('rejects an existing normalized email', async () => {
    await registerHandler().execute(
      new RegisterUserCommand({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );

    await expect(
      registerHandler().execute(
        new RegisterUserCommand({
          name: 'Other Alice',
          email: ' ALICE@EXAMPLE.COM ',
          password: 'password123',
        }),
      ),
    ).rejects.toBeInstanceOf(EmailAlreadyExistsError);
  });

  it('logs in with valid credentials and allows multiple sessions', async () => {
    await registerHandler().execute(
      new RegisterUserCommand({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    const handler = loginHandler();

    const first = await handler.execute(
      new LoginUserCommand({
        email: ' ALICE@example.com ',
        password: 'password123',
      }),
    );
    const second = await handler.execute(
      new LoginUserCommand({
        email: 'alice@example.com',
        password: 'password123',
      }),
    );

    expect(first.user).toEqual(second.user);
    expect(first.rawSessionToken).not.toBe(second.rawSessionToken);
    expect(repository.sessions).toHaveLength(3);
  });

  it.each([
    ['alice@example.com', 'wrong-password'],
    ['missing@example.com', 'password123'],
  ])(
    'uses one public error for invalid credentials',
    async (email, password) => {
      await registerHandler().execute(
        new RegisterUserCommand({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password123',
        }),
      );

      await expect(
        loginHandler().execute(new LoginUserCommand({ email, password })),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    },
  );

  it('logs out only the selected session and remains idempotent', async () => {
    await registerHandler().execute(
      new RegisterUserCommand({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    await loginHandler().execute(
      new LoginUserCommand({
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    const handler = new LogoutSessionHandler(repository, tokenHasher);

    await handler.execute(new LogoutSessionCommand('token-1'));
    await handler.execute(new LogoutSessionCommand('token-1'));

    expect(repository.sessions).toHaveLength(1);
    expect(repository.sessions[0]?.tokenHash).toBe('hash:token-2');
  });

  it('returns only safe current-user data', async () => {
    await registerHandler().execute(
      new RegisterUserCommand({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    const handler = new GetCurrentUserHandler(repository, tokenHasher, clock);

    await expect(
      handler.execute(new GetCurrentUserQuery('token-1')),
    ).resolves.toEqual({
      id: 'id-1',
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  it('rejects an expired session without extending it', async () => {
    await registerHandler().execute(
      new RegisterUserCommand({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    const expiresAtUtc = repository.sessions[0]?.expiresAtUtc ?? 0;
    clock.value = expiresAtUtc;
    const handler = new GetCurrentUserHandler(repository, tokenHasher, clock);

    await expect(
      handler.execute(new GetCurrentUserQuery('token-1')),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(repository.sessions[0]?.expiresAtUtc).toBe(expiresAtUtc);
  });

  function registerHandler(): RegisterUserHandler {
    return new RegisterUserHandler(
      repository,
      passwordHasher,
      tokenGenerator,
      tokenHasher,
      clock,
      idGenerator,
      sessionTtl,
    );
  }

  function loginHandler(): LoginUserHandler {
    return new LoginUserHandler(
      repository,
      passwordHasher,
      tokenGenerator,
      tokenHasher,
      clock,
      idGenerator,
      sessionTtl,
    );
  }
});

class InMemoryAuthRepository implements AuthRepository {
  public users: NewUserRecord[] = [];
  public sessions: NewSessionRecord[] = [];

  public findUserCredentials(normalizedEmail: string) {
    return (
      this.users.find((user) => user.normalizedEmail === normalizedEmail) ??
      null
    );
  }

  public normalizedEmailExists(normalizedEmail: string): boolean {
    return this.users.some((user) => user.normalizedEmail === normalizedEmail);
  }

  public createUserAndSession(
    user: NewUserRecord,
    session: NewSessionRecord,
  ): void {
    this.users.push(user);
    this.sessions.push(session);
  }

  public createSession(session: NewSessionRecord): void {
    this.sessions.push(session);
  }

  public findActiveSessionUser(tokenHash: string, nowUtc: number) {
    const session = this.sessions.find(
      (candidate) =>
        candidate.tokenHash === tokenHash && candidate.expiresAtUtc > nowUtc,
    );
    const user = this.users.find(
      (candidate) => candidate.id === session?.userId,
    );

    return user ? { id: user.id, name: user.name, email: user.email } : null;
  }

  public deleteSession(tokenHash: string): void {
    this.sessions = this.sessions.filter(
      (session) => session.tokenHash !== tokenHash,
    );
  }
}

class TestPasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return `test:${password}`;
  }

  public async verify(hash: string, password: string): Promise<boolean> {
    return hash === `test:${password}`;
  }
}

class SequenceTokenGenerator implements SessionTokenGenerator {
  private sequence = 0;

  public generate(): string {
    this.sequence += 1;
    return `token-${this.sequence}`;
  }
}

class SequenceIdGenerator implements IdGenerator {
  private sequence = 0;

  public generate(): string {
    this.sequence += 1;
    return `id-${this.sequence}`;
  }
}

class MutableClock implements Clock {
  public value = Date.UTC(2026, 0, 1);

  public now(): number {
    return this.value;
  }
}
