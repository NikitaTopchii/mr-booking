import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DatabaseConnection,
  openDatabase,
  verifySqlitePragmas,
} from './database-connection';
import { applyMigrations, resolveMigrationsFolder } from './migrations';

describe('SQLite foundation', () => {
  let temporaryDirectory: string;
  let connection: DatabaseConnection;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'mr-booking-db-'));
    connection = openDatabase(join(temporaryDirectory, 'test.sqlite'));
  });

  afterEach(() => {
    connection.close();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('enables and verifies the required PRAGMAs', () => {
    expect(verifySqlitePragmas(connection.sqlite)).toEqual({
      journalMode: 'wal',
      foreignKeys: 1,
      busyTimeoutMilliseconds: 5000,
    });
  });

  it('applies committed migrations to a file-backed database', () => {
    applyMigrations(connection, resolveMigrationsFolder());

    const roomTable = connection.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'rooms'",
      )
      .get();

    expect(roomTable).toEqual({ name: 'rooms' });
  });

  it('applies committed migrations repeatedly without changing schema', () => {
    applyMigrations(connection, resolveMigrationsFolder());
    applyMigrations(connection, resolveMigrationsFolder());

    const migrationCount = connection.sqlite
      .prepare('SELECT COUNT(*) AS count FROM __drizzle_migrations')
      .get();

    expect(migrationCount).toEqual({ count: 3 });
  });

  it('rolls back an immediate transaction when the operation fails', () => {
    connection.sqlite.exec('CREATE TABLE values_table (value INTEGER)');

    expect(() =>
      connection.withImmediateTransaction(() => {
        connection.sqlite.exec('INSERT INTO values_table VALUES (1)');
        throw new Error('stop');
      }),
    ).toThrow('stop');

    expect(
      connection.sqlite
        .prepare('SELECT COUNT(*) AS count FROM values_table')
        .get(),
    ).toEqual({ count: 0 });
  });
});
