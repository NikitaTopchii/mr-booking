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
      'libs/shared/i18n/project.json',
      'libs/shared/ui/project.json',
      'libs/rooms/data-access/project.json',
      'libs/auth/domain/project.json',
      'libs/auth/data-access/project.json',
      'libs/auth/data-access-web/project.json',
      'libs/auth/feature/project.json',
      'libs/auth/feature-web/project.json',
      'libs/auth/ui/project.json',
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
    const webDirectories = [
      'apps/web/src',
      'libs/auth/data-access-web/src',
      'libs/auth/feature-web/src',
      'libs/auth/ui/src',
      'libs/shared/i18n/src',
      'libs/shared/ui/src',
    ];
    const webSource = webDirectories
      .flatMap((directory) => listSourceFiles(join(workspaceRoot, directory)))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(webSource).not.toMatch(
      /@mr-booking\/shared-database|better-sqlite3|drizzle-orm|argon2|@nestjs/,
    );
  });

  it('keeps server dictionaries out of Client Component entry points', () => {
    const clientSourceFiles = [
      ...listSourceFiles(join(workspaceRoot, 'libs/auth/feature-web/src')),
      ...listSourceFiles(join(workspaceRoot, 'libs/auth/ui/src')),
      join(workspaceRoot, 'libs/auth/data-access-web/src/client.ts'),
      join(workspaceRoot, 'libs/auth/data-access-web/src/lib/auth-client.ts'),
    ];

    for (const file of clientSourceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('@mr-booking/shared-i18n/server');
      expect(source).not.toContain('getDictionary');
    }
  });

  it('keeps auth presentation free of routing and data-access dependencies', () => {
    const authUiSource = listSourceFiles(
      join(workspaceRoot, 'libs/auth/ui/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const browserBarrel = readFileSync(
      join(workspaceRoot, 'libs/auth/data-access-web/src/index.ts'),
      'utf8',
    );

    expect(authUiSource).not.toMatch(
      /next\/(?:navigation|link)|@mr-booking\/auth-data-access-web|fetch\(/,
    );
    expect(browserBarrel).not.toContain('./lib/server-auth');
  });
});
