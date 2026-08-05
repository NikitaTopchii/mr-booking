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
    const projectFiles = [
      'apps/web/project.json',
      'apps/api/project.json',
      'libs/shared/config/project.json',
      'libs/shared/database/project.json',
      'libs/shared/i18n/project.json',
      'libs/shared/ui/project.json',
      'libs/booking/domain/project.json',
      'libs/booking/infrastructure/project.json',
      'libs/booking/data-access/project.json',
      'libs/booking/application/project.json',
      'libs/rooms/domain/project.json',
      'libs/rooms/infrastructure/project.json',
      'libs/rooms/data-access/project.json',
      'libs/auth/domain/project.json',
      'libs/auth/infrastructure/project.json',
      'libs/auth/data-access/project.json',
      'libs/auth/data-access-web/project.json',
      'libs/auth/application/project.json',
      'libs/auth/feature-web/project.json',
      'libs/auth/feature-email-verification/project.json',
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

  it('keeps backend application libraries inward-facing', () => {
    const applicationProjects = [
      {
        projectFile: 'libs/auth/application/project.json',
        sourceDirectory: 'libs/auth/application/src',
      },
      {
        projectFile: 'libs/booking/application/project.json',
        sourceDirectory: 'libs/booking/application/src',
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
      'libs/booking/infrastructure/project.json',
    );
    expect(bookingInfrastructureProject.tags).toEqual(
      expect.arrayContaining([
        'scope:booking',
        'type:infrastructure',
        'platform:api',
      ]),
    );
    const bookingInfrastructureProjectSource = readFileSync(
      join(workspaceRoot, 'libs/booking/infrastructure/project.json'),
      'utf8',
    );
    expect(bookingInfrastructureProjectSource).toContain('"test"');

    const schemaEntrypoints = [
      'libs/auth/infrastructure/src/schema.ts',
      'libs/booking/infrastructure/src/schema.ts',
      'libs/rooms/infrastructure/src/schema.ts',
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
        join(workspaceRoot, 'libs/auth/infrastructure/src/lib/auth-schema.ts'),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/booking/infrastructure/src/lib/booking-schema.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(workspaceRoot, 'libs/rooms/infrastructure/src/lib/room-schema.ts'),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          workspaceRoot,
          'libs/booking/data-access/src/lib/booking-schema.ts',
        ),
      ),
    ).toBe(false);

    const infrastructureRoots = [
      'libs/auth/infrastructure/src/index.ts',
      'libs/booking/infrastructure/src/index.ts',
      'libs/rooms/infrastructure/src/index.ts',
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
      join(workspaceRoot, 'libs/auth/data-access/src/index.ts'),
      'utf8',
    );
    const roomsDataAccessBarrel = readFileSync(
      join(workspaceRoot, 'libs/rooms/data-access/src/index.ts'),
      'utf8',
    );
    const bookingDataAccessBarrel = readFileSync(
      join(workspaceRoot, 'libs/booking/data-access/src/index.ts'),
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
      join(workspaceRoot, 'libs/booking/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const authDataAccessSource = listSourceFiles(
      join(workspaceRoot, 'libs/auth/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const roomsDataAccessSource = listSourceFiles(
      join(workspaceRoot, 'libs/rooms/data-access/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    expect(bookingDataAccessSource).not.toMatch(/sqliteTable|booking-schema/);
    expect(authDataAccessSource).not.toContain('sqliteTable');
    expect(roomsDataAccessSource).not.toContain('sqliteTable');
  });

  it('keeps schedule ownership out of booking-ui and feature boundaries', () => {
    const bookingUiSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/ui/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const scheduleSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/features/schedule/src'),
    )
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const myBookingsSource = listSourceFiles(
      join(workspaceRoot, 'libs/booking/features/my-bookings/src'),
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
          'libs/booking/features/schedule/src/lib/weekly-schedule/model/schedule-range.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(workspaceRoot, 'libs/booking/ui/src/lib/schedule-range.ts'),
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
      /@mr-booking\/(?:auth|booking|rooms)-infrastructure|@mr-booking\/shared-database|better-sqlite3|drizzle-orm|argon2|@nestjs/,
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
      .filter((file) => !file.endsWith('/use-auth-expiry-redirect.ts'))
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
