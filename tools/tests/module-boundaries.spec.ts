import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const workspaceRoot = resolve(__dirname, '../..');

interface ProjectConfiguration {
  readonly tags: readonly string[];
}

function readProject(path: string): ProjectConfiguration {
  return JSON.parse(
    readFileSync(join(workspaceRoot, path), 'utf8'),
  ) as ProjectConfiguration;
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(path) : [path];
  });
}

describe('Nx module-boundary configuration', () => {
  it('assigns platform and type tags to every foundation project', () => {
    const projectFiles = [
      'apps/web/project.json',
      'apps/api/project.json',
      'libs/shared/config/project.json',
      'libs/shared/database/project.json',
      'libs/rooms/data-access/project.json',
      'tools/project.json',
    ];

    for (const projectFile of projectFiles) {
      const project = readProject(projectFile);
      expect(project.tags.some((tag) => tag.startsWith('type:'))).toBe(true);
      expect(project.tags.some((tag) => tag.startsWith('platform:'))).toBe(
        true,
      );
      expect(project.tags.some((tag) => tag.startsWith('scope:'))).toBe(true);
    }
  });

  it('keeps module-boundary enforcement configured as an error', () => {
    const eslintConfiguration = readFileSync(
      join(workspaceRoot, 'eslint.config.mjs'),
      'utf8',
    );

    expect(eslintConfiguration).toContain("'@nx/enforce-module-boundaries': [");
    expect(eslintConfiguration).toContain("'error'");
    expect(eslintConfiguration).toContain("'platform:web'");
    expect(eslintConfiguration).toContain("'platform:api'");
  });

  it('keeps database packages out of web source', () => {
    const webSource = listSourceFiles(join(workspaceRoot, 'apps/web/src'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(webSource).not.toMatch(
      /@mr-booking\/shared-database|better-sqlite3|drizzle-orm/,
    );
  });
});
