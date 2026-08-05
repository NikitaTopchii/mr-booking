import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { SqlitePragmaState } from './types/database-connection.types';

export class DatabaseConnection {
  public readonly drizzle;

  public constructor(public readonly sqlite: BetterSqlite3.Database) {
    this.drizzle = drizzle(sqlite);
  }

  public close(): void {
    if (this.sqlite.open) {
      this.sqlite.close();
    }
  }

  public assertHealthy(): void {
    const result = this.sqlite.prepare('SELECT 1 AS healthy').get();

    if (
      typeof result !== 'object' ||
      result === null ||
      !('healthy' in result) ||
      result.healthy !== 1
    ) {
      throw new Error('SQLite health query did not return the expected value');
    }
  }

  public withImmediateTransaction<T>(operation: () => T): T {
    this.sqlite.exec('BEGIN IMMEDIATE');

    try {
      const result = operation();
      this.sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      if (this.sqlite.inTransaction) {
        this.sqlite.exec('ROLLBACK');
      }

      throw error;
    }
  }
}

export function openDatabase(databasePath: string): DatabaseConnection {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const sqlite = new BetterSqlite3(databasePath);

  try {
    const journalMode = sqlite.pragma('journal_mode = WAL', { simple: true });
    sqlite.pragma('foreign_keys = ON');
    sqlite.pragma('busy_timeout = 5000');

    if (journalMode !== 'wal') {
      throw new Error(`Expected SQLite WAL mode, received ${journalMode}`);
    }

    verifySqlitePragmas(sqlite);
    return new DatabaseConnection(sqlite);
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

export function verifySqlitePragmas(
  sqlite: BetterSqlite3.Database,
): SqlitePragmaState {
  const journalMode = sqlite.pragma('journal_mode', { simple: true });
  const foreignKeys = sqlite.pragma('foreign_keys', { simple: true });
  const busyTimeout = sqlite.pragma('busy_timeout', { simple: true });

  if (journalMode !== 'wal') {
    throw new Error('SQLite journal_mode must be WAL');
  }

  if (foreignKeys !== 1) {
    throw new Error('SQLite foreign_keys must be enabled');
  }

  if (busyTimeout !== 5000) {
    throw new Error('SQLite busy_timeout must be 5000 milliseconds');
  }

  return {
    journalMode: 'wal',
    foreignKeys: 1,
    busyTimeoutMilliseconds: 5000,
  };
}
