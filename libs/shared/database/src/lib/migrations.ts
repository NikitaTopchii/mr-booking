import { existsSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { DatabaseConnection } from './database-connection';

export function resolveMigrationsFolder(
  startDirectory = process.cwd(),
): string {
  return findMigrationsFolder(startDirectory);
}

export function applyMigrations(
  connection: DatabaseConnection,
  migrationsFolder = resolveMigrationsFolder(),
): void {
  migrate(connection.drizzle, { migrationsFolder });
}

function findMigrationsFolder(startDirectory: string): string {
  let directory = resolve(startDirectory);
  const filesystemRoot = parse(directory).root;

  while (true) {
    const migrationsFolder = join(directory, 'drizzle/migrations');

    if (existsSync(join(migrationsFolder, 'meta/_journal.json'))) {
      return migrationsFolder;
    }

    if (
      existsSync(join(directory, 'package.json')) &&
      existsSync(join(directory, 'nx.json'))
    ) {
      throw new Error(
        `Committed migrations are missing from ${migrationsFolder}`,
      );
    }

    if (directory === filesystemRoot) {
      throw new Error(
        `Unable to find committed migrations above ${startDirectory}`,
      );
    }

    directory = dirname(directory);
  }
}
