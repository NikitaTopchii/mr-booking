import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { EmailAlreadyExistsError } from '@mr-booking/auth-domain';
import {
  applyMigrations,
  type DatabaseConnection,
  type DatabaseService,
  openDatabase,
} from '@mr-booking/shared-database';
import { eq, sql } from 'drizzle-orm';
import { DrizzleAuthRepository } from './auth-repository';
import { sessions, users } from './auth-schema';
import { seedAuthUsers } from './auth-seed';
import { Argon2PasswordHasher } from './security-adapters';

describe('Drizzle authentication persistence', () => {
  let directory: string;
  let databasePath: string;
  let connection: DatabaseConnection;
  let repository: DrizzleAuthRepository;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mr-booking-auth-'));
    databasePath = join(directory, 'auth.sqlite');
    connection = openDatabase(databasePath);
    applyMigrations(connection);
    repository = new DrizzleAuthRepository({
      connection,
    } as unknown as DatabaseService);
  });

  afterEach(() => {
    connection.close();
    rmSync(directory, { force: true, recursive: true });
  });

  it('creates users and sessions through committed repeatable migrations', () => {
    applyMigrations(connection);

    const tableNames = connection.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'sessions') ORDER BY name",
      )
      .all();

    expect(tableNames).toEqual([{ name: 'sessions' }, { name: 'users' }]);
  });

  it('enforces normalized email uniqueness after both race participants precheck', () => {
    expect(repository.normalizedEmailExists('alice@example.com')).toBe(false);
    expect(repository.normalizedEmailExists('alice@example.com')).toBe(false);

    repository.createUserAndSession(
      userRecord('user-1', 'Alice@Example.com', 'alice@example.com'),
      sessionRecord('session-1', 'user-1', 'hash-1'),
    );

    expect(() =>
      repository.createUserAndSession(
        userRecord('user-2', ' ALICE@EXAMPLE.COM ', 'alice@example.com'),
        sessionRecord('session-2', 'user-2', 'hash-2'),
      ),
    ).toThrow(EmailAlreadyExistsError);

    expect(
      connection.drizzle
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .get()?.count,
    ).toBe(1);
  });

  it('allows exactly one winner during concurrent duplicate registration', async () => {
    const first = createConcurrentUserInsert(databasePath, 'concurrent-1');
    const second = createConcurrentUserInsert(databasePath, 'concurrent-2');
    await Promise.all([first.ready, second.ready]);
    first.start();
    second.start();

    const results = await Promise.all([first.result, second.result]);
    const createdUsers = connection.drizzle
      .select({ id: users.id })
      .from(users)
      .where(eq(users.normalizedEmail, 'race@example.com'))
      .all();

    expect(results.sort()).toEqual(['constraint', 'created']);
    expect(createdUsers).toHaveLength(1);
  });

  it('enforces unique session hashes and foreign keys', () => {
    repository.createUserAndSession(
      userRecord('user-1', 'alice@example.com', 'alice@example.com'),
      sessionRecord('session-1', 'user-1', 'hash-1'),
    );

    expect(() =>
      repository.createSession(sessionRecord('session-2', 'user-1', 'hash-1')),
    ).toThrow();
    expect(() =>
      repository.createSession(
        sessionRecord('session-foreign', 'missing-user', 'hash-foreign'),
      ),
    ).toThrow();
  });

  it('deletes only the selected session', () => {
    repository.createUserAndSession(
      userRecord('user-1', 'alice@example.com', 'alice@example.com'),
      sessionRecord('session-1', 'user-1', 'hash-1'),
    );
    repository.createSession(sessionRecord('session-2', 'user-1', 'hash-2'));

    repository.deleteSession('hash-1');

    expect(connection.drizzle.select().from(sessions).all()).toEqual([
      expect.objectContaining({ id: 'session-2', tokenHash: 'hash-2' }),
    ]);
  });

  it('stores an Argon2 hash rather than the seeded plaintext password', async () => {
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    const alice = connection.drizzle
      .select()
      .from(users)
      .where(eq(users.normalizedEmail, 'alice@example.com'))
      .get();

    expect(alice?.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(alice?.passwordHash).not.toContain('password123');
  });

  it('seeds Alice and Bob idempotently without resetting existing users', async () => {
    const hasher = new Argon2PasswordHasher();
    await seedAuthUsers(connection, hasher);
    const before = connection.drizzle.select().from(users).all();
    await seedAuthUsers(connection, hasher);
    const after = connection.drizzle.select().from(users).all();

    expect(after).toEqual(before);
    expect(after.map((user) => user.id).sort()).toEqual([
      'user-alice',
      'user-bob',
    ]);
  });
});

function userRecord(id: string, email: string, normalizedEmail: string) {
  return {
    id,
    name: 'Alice',
    email,
    normalizedEmail,
    passwordHash: '$argon2id$not-plaintext',
    createdAtUtc: Date.UTC(2026, 0, 1),
  };
}

function sessionRecord(id: string, userId: string, tokenHash: string) {
  const createdAtUtc = Date.UTC(2026, 0, 1);
  return {
    id,
    userId,
    tokenHash,
    createdAtUtc,
    expiresAtUtc: createdAtUtc + 60_000,
  };
}

function createConcurrentUserInsert(databasePath: string, id: string) {
  const worker = new Worker(
    `
      const { parentPort, workerData } = require('node:worker_threads');
      const Database = require('better-sqlite3');
      const database = new Database(workerData.databasePath);
      database.pragma('foreign_keys = ON');
      database.pragma('busy_timeout = 5000');
      parentPort.postMessage('ready');
      parentPort.once('message', () => {
        try {
          database.prepare(
            'INSERT INTO users (id, name, email, normalized_email, password_hash, created_at_utc) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            workerData.id,
            'Race User',
            'Race@Example.com',
            'race@example.com',
            '$argon2id$test-hash',
            Date.UTC(2026, 0, 1)
          );
          parentPort.postMessage('created');
        } catch (error) {
          parentPort.postMessage(
            typeof error.code === 'string' && error.code.startsWith('SQLITE_CONSTRAINT')
              ? 'constraint'
              : 'unexpected'
          );
        } finally {
          database.close();
          parentPort.close();
        }
      });
    `,
    {
      eval: true,
      workerData: { databasePath, id },
    },
  );
  const ready = new Promise<void>((resolve, reject) => {
    worker.once('message', (message) => {
      if (message === 'ready') {
        resolve();
      } else {
        reject(new Error(`Worker was not ready: ${String(message)}`));
      }
    });
    worker.once('error', reject);
  });
  const result = new Promise<string>((resolve, reject) => {
    const onMessage = (message: unknown) => {
      if (message !== 'ready') {
        worker.off('error', reject);
        resolve(String(message));
      }
    };
    worker.on('message', onMessage);
    worker.once('error', reject);
  });

  return {
    ready,
    result,
    start: () => worker.postMessage('start'),
  };
}
