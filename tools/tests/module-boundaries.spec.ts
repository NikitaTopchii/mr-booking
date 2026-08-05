import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ProjectConfiguration } from './types/module-boundaries.types';

const workspaceRoot = resolve(__dirname, '../..');

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
    const expectedTags = {
      'apps/api/project.json': ['scope:app', 'type:app', 'platform:server'],
      'apps/web/project.json': ['scope:app', 'type:app', 'platform:web'],
      'tools/project.json': [
        'scope:workspace',
        'type:tooling',
        'platform:server',
      ],
      'libs/auth/server/application/project.json': [
        'scope:auth',
        'type:application',
        'platform:server',
      ],
      'libs/auth/server/data-access/project.json': [
        'scope:auth',
        'type:data-access',
        'platform:server',
      ],
      'libs/auth/web/data-access/project.json': [
        'scope:auth',
        'type:data-access',
        'platform:web',
      ],
      'libs/auth/domain/project.json': [
        'scope:auth',
        'type:domain',
        'platform:agnostic',
      ],
      'libs/auth/web/features/email-verification/project.json': [
        'scope:auth',
        'type:feature',
        'platform:web',
      ],
      'libs/auth/web/features/access/project.json': [
        'scope:auth',
        'type:feature',
        'platform:web',
      ],
      'libs/auth/server/infrastructure/project.json': [
        'scope:auth',
        'type:infrastructure',
        'platform:server',
      ],
      'libs/auth/web/ui/project.json': [
        'scope:auth',
        'type:ui',
        'platform:web',
      ],
      'libs/booking/server/application/project.json': [
        'scope:booking',
        'type:application',
        'platform:server',
      ],
      'libs/booking/server/data-access/project.json': [
        'scope:booking',
        'type:data-access',
        'platform:server',
      ],
      'libs/booking/web/data-access/project.json': [
        'scope:booking',
        'type:data-access',
        'platform:web',
      ],
      'libs/booking/domain/project.json': [
        'scope:booking',
        'type:domain',
        'platform:agnostic',
      ],
      'libs/booking/web/features/my-bookings/project.json': [
        'scope:booking',
        'type:feature',
        'platform:web',
      ],
      'libs/booking/web/features/schedule/project.json': [
        'scope:booking',
        'type:feature',
        'platform:web',
      ],
      'libs/booking/server/infrastructure/project.json': [
        'scope:booking',
        'type:infrastructure',
        'platform:server',
      ],
      'libs/booking/web/ui/project.json': [
        'scope:booking',
        'type:ui',
        'platform:web',
      ],
      'libs/rooms/server/data-access/project.json': [
        'scope:rooms',
        'type:data-access',
        'platform:server',
      ],
      'libs/rooms/domain/project.json': [
        'scope:rooms',
        'type:domain',
        'platform:agnostic',
      ],
      'libs/rooms/server/infrastructure/project.json': [
        'scope:rooms',
        'type:infrastructure',
        'platform:server',
      ],
      'libs/shared/config/project.json': [
        'scope:shared',
        'type:util',
        'platform:agnostic',
      ],
      'libs/shared/server/database/project.json': [
        'scope:shared',
        'type:infrastructure',
        'platform:server',
      ],
      'libs/shared/agnostic/date-time/project.json': [
        'scope:shared',
        'type:util',
        'platform:agnostic',
      ],
      'libs/shared/agnostic/error-handling/project.json': [
        'scope:shared',
        'type:util',
        'platform:agnostic',
      ],
      'libs/shared/web/i18n/project.json': [
        'scope:shared',
        'type:util',
        'platform:web',
      ],
      'libs/shared/web/ui/project.json': [
        'scope:shared',
        'type:ui',
        'platform:web',
      ],
    } as const;

    for (const [projectFile, tags] of Object.entries(expectedTags)) {
      const project = readProject(projectFile);
      expect(project.tags).toEqual(tags);
    }

    expect(readProject('libs/auth/web/features/access/project.json').name).toBe(
      'auth-feature-access',
    );
    expect(
      readProject('libs/shared/agnostic/error-handling/project.json').name,
    ).toBe('shared-error-handling');
  });

  it('uses domain-first physical platform grouping without compatibility aliases', () => {
    const tsconfig = readFileSync(
      join(workspaceRoot, 'tsconfig.base.json'),
      'utf8',
    );
    const projectRoots = [
      'libs/auth/server',
      'libs/auth/web',
      'libs/auth/web/features',
      'libs/booking/server',
      'libs/booking/web',
      'libs/booking/web/features',
      'libs/rooms/server',
      'libs/shared/agnostic',
      'libs/shared/server',
      'libs/shared/web',
    ];

    for (const groupingDirectory of projectRoots) {
      expect(existsSync(join(workspaceRoot, groupingDirectory))).toBe(true);
      expect(
        existsSync(join(workspaceRoot, groupingDirectory, 'project.json')),
      ).toBe(false);
    }

    expect(tsconfig).toContain('@mr-booking/auth-feature-access');
    expect(tsconfig).toContain('@mr-booking/shared-error-handling');
    expect(tsconfig).not.toContain('@mr-booking/auth-feature-web');
    expect(tsconfig).not.toContain('@mr-booking/shared-feature-error');
    expect(
      existsSync(join(workspaceRoot, 'libs/shared/config/project.json')),
    ).toBe(true);
  });

  it('keeps backend application libraries inward-facing', () => {
    const applicationProjects = [
      {
        projectFile: 'libs/auth/server/application/project.json',
        sourceDirectory: 'libs/auth/server/application/src',
      },
      {
        projectFile: 'libs/booking/server/application/project.json',
        sourceDirectory: 'libs/booking/server/application/src',
      },
    ];

    for (const { projectFile, sourceDirectory } of applicationProjects) {
      const project = readProject(projectFile);
      expect(project.tags).toContain('type:application');

      const source = listSourceFiles(join(workspaceRoot, sourceDirectory))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n');

      expect(source).not.toMatch(
        /@mr-booking\/(?:auth-data-access|booking-data-access|rooms-data-access|auth-infrastructure|booking-infrastructure|rooms-infrastructure|shared-database|shared-config)/,
      );
    }
  });

  it('keeps persistence schemas behind their owning infrastructure APIs', () => {
    const bookingInfrastructureProject = readProject(
      'libs/booking/server/infrastructure/project.json',
    );
    expect(bookingInfrastructureProject.tags).toEqual(
      expect.arrayContaining([
        'scope:booking',
        'type:infrastructure',
        'platform:server',
      ]),
    );
    const bookingInfrastructureProjectSource = readFileSync(
      join(workspaceRoot, 'libs/booking/server/infrastructure/project.json'),
      'utf8',
    );
    expect(bookingInfrastructureProjectSource).toContain('"test"');

    const schemaEntrypoints = [
      'libs/auth/server/infrastructure/src/schema.ts',
      'libs/booking/server/infrastructure/src/schema.ts',
      'libs/rooms/server/infrastructure/src/schema.ts',
    ];

    for (const schemaEntrypoint of schemaEntrypoints) {
      const schemaSource = readFileSync(
        join(workspaceRoot, schemaEntrypoint),
        'utf8',
      );
      expect(schemaSource).toMatch(/schema/);
      expect(schemaSource).not.toMatch(
        /DataAccessModule|SeedService|Delivery|ApplicationHandler/,
      );
    }

    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/auth/server/infrastructure/src/lib/auth-schema.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/booking/server/infrastructure/src/lib/booking-schema.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/rooms/server/infrastructure/src/lib/room-schema.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/booking/server/data-access/src/lib/booking-schema.ts',
        ),
      ),
    ).toBe(false);

    const infrastructureRoots = [
      'libs/auth/server/infrastructure/src/index.ts',
      'libs/booking/server/infrastructure/src/index.ts',
      'libs/rooms/server/infrastructure/src/index.ts',
    ]
      .map((path) => readFileSync(join(workspaceRoot, path), 'utf8'))
      .join('\n');
    expect(infrastructureRoots).not.toMatch(
      /auth-schema|booking-schema|room-schema/,
    );

    const drizzleConfiguration = readFileSync(
      join(workspaceRoot, 'drizzle.config.ts'),
      'utf8',
    );
    for (const schemaEntrypoint of schemaEntrypoints) {
      expect(drizzleConfiguration).toContain(schemaEntrypoint);
    }

    const authDataAccessBarrel = readFileSync(
      join(workspaceRoot, 'libs/auth/server/data-access/src/index.ts'),
      'utf8',
    );
    const roomsDataAccessBarrel = readFileSync(
      join(workspaceRoot, 'libs/rooms/server/data-access/src/index.ts'),
      'utf8',
    );
    const bookingDataAccessBarrel = readFileSync(
      join(workspaceRoot, 'libs/booking/server/data-access/src/index.ts'),
      'utf8',
    );

    expect(authDataAccessBarrel).not.toContain(
      "export * from '@mr-booking/auth-infrastructure'",
    );
    expect(roomsDataAccessBarrel).not.toContain(
      "export * from '@mr-booking/rooms-infrastructure'",
    );
    expect(bookingDataAccessBarrel).not.toMatch(
      /booking-schema|demo-booking-seed\/(?:demo-booking-definitions|demo-booking-seed)/,
    );

    const bookingDataAccessSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/server/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const authDataAccessSource = listSourceFiles(
      join(workspaceRoot, 'libs/auth/server/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const roomsDataAccessSource = listSourceFiles(
      join(workspaceRoot, 'libs/rooms/server/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    expect(bookingDataAccessSource).not.toMatch(/sqliteTable|booking-schema/);
    expect(authDataAccessSource).not.toContain('sqliteTable');
    expect(roomsDataAccessSource).not.toContain('sqliteTable');
  });

  it('keeps schedule ownership out of booking-ui and feature boundaries', () => {
    const bookingUiSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/web/ui/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const scheduleSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/web/features/schedule/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const myBookingsSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/web/features/my-bookings/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(bookingUiSource).not.toMatch(
      /schedule-(?:calendar-policy|indicators|navigation|range|zoned-time)|types\/schedule\.types|createSchedule(?:Range|Week|SearchParams|BookingHref)/,
    );
    expect(bookingUiSource).toContain('useBrowserTimeZone');
    expect(scheduleSource).not.toContain(
      '@mr-booking/booking-feature-my-bookings',
    );
    expect(myBookingsSource).not.toContain(
      '@mr-booking/booking-feature-schedule',
    );
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/booking/web/features/schedule/src/lib/weekly-schedule/model/schedule-range.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(workspaceRoot, 'libs/booking/web/ui/src/lib/schedule-range.ts'),
      ),
    ).toBe(false);
  });

  it('keeps module-boundary enforcement configured as an error', () => {
    const eslintConfiguration = readFileSync(
      join(workspaceRoot, 'eslint.config.mjs'),
      'utf8',
    );

    expect(eslintConfiguration).toContain("'@nx/enforce-module-boundaries': [");
    expect(eslintConfiguration).toContain("'error'");
    expect(eslintConfiguration).toContain("'platform:web'");
    expect(eslintConfiguration).toContain("'platform:server'");
    expect(eslintConfiguration).toContain("'platform:agnostic'");
    expect(eslintConfiguration).toContain("'scope:workspace'");
    expect(eslintConfiguration).not.toContain("'platform:api'");
    expect(eslintConfiguration).not.toContain("'platform:shared'");
  });

  it('runs deterministic graph and source-import auditing before commit verification', () => {
    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };
    const verificationScript = readFileSync(
      join(workspaceRoot, 'tools/scripts/verify-commit.mjs'),
      'utf8',
    );
    const auditScript = readFileSync(
      join(workspaceRoot, 'tools/scripts/audit-module-boundaries.mjs'),
      'utf8',
    );

    expect(packageJson.scripts['audit:boundaries']).toBe(
      'node tools/scripts/audit-module-boundaries.mjs',
    );
    expect(verificationScript).toContain("'audit:boundaries'");
    expect(auditScript).toContain('crossScopeAllowlist');
    expect(auditScript).toContain('may not import persistence schemas');
    expect(auditScript).toContain(
      'may not import the Next server-only entry point',
    );
  });

  it('keeps database packages out of web source', () => {
    const webDirectories = [
      'apps/web/src',
      'libs/auth/web/data-access/src',
      'libs/auth/web/features/access/src',
      'libs/auth/web/ui/src',
      'libs/shared/web/i18n/src',
      'libs/shared/web/ui/src',
    ];
    const webSource = webDirectories
      .flatMap((directory) => listSourceFiles(join(workspaceRoot, directory)))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(webSource).not.toMatch(
      /@mr-booking\/(?:auth|booking|rooms)-infrastructure|@mr-booking\/shared-database|better-sqlite3|drizzle-orm|argon2|@nestjs/,
    );
  });

  it('keeps server dictionaries out of Client Component entry points', () => {
    const clientSourceFiles = [
      ...listSourceFiles(
        join(workspaceRoot, 'libs/auth/web/features/access/src'),
      ),
      ...listSourceFiles(join(workspaceRoot, 'libs/auth/web/ui/src')),
      join(workspaceRoot, 'libs/auth/web/data-access/src/client.ts'),
      join(workspaceRoot, 'libs/auth/web/data-access/src/lib/auth-client.ts'),
    ];

    for (const file of clientSourceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('@mr-booking/shared-i18n/server');
      expect(source).not.toContain('getDictionary');
    }
  });

  it('keeps auth presentation free of routing and data-access dependencies', () => {
    const authUiSource = listSourceFiles(
      join(workspaceRoot, 'libs/auth/web/ui/src'),
    )
      .filter((file) => !file.endsWith('/use-auth-expiry-redirect.ts'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const browserBarrel = readFileSync(
      join(workspaceRoot, 'libs/auth/web/data-access/src/index.ts'),
      'utf8',
    );

    expect(authUiSource).not.toMatch(
      /next\/(?:navigation|link)|@mr-booking\/auth-data-access-web|fetch\(/,
    );
    expect(browserBarrel).not.toContain('./lib/server-auth');
  });
});
