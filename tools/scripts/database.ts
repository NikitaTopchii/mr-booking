import {
  Argon2PasswordHasher,
  seedAuthUsers,
} from '@mr-booking/auth-data-access';
import { seedDemoBookings } from '@mr-booking/booking-data-access/seed';
import { applyMigrations, openDatabase } from '@mr-booking/shared-database';
import { seedRooms } from '@mr-booking/rooms-data-access';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { loadRootEnvironmentFile } from '@mr-booking/shared-config/node';

const supportedCommands = ['validate', 'migrate', 'seed'] as const;

function isDatabaseCommand(
  value: string | undefined,
): value is (typeof supportedCommands)[number] {
  return supportedCommands.some((command) => command === value);
}

async function run(): Promise<void> {
  loadRootEnvironmentFile();
  const environment = parseRuntimeEnvironment(process.env);
  const command = process.argv[2];

  if (!isDatabaseCommand(command)) {
    throw new Error(
      `Expected one database command: ${supportedCommands.join(', ')}`,
    );
  }

  if (command === 'validate') {
    process.stdout.write('Runtime environment is valid.\n');
    return;
  }

  const connection = openDatabase(environment.DATABASE_PATH);

  try {
    if (command === 'migrate') {
      applyMigrations(connection);
      process.stdout.write('Database migrations completed.\n');
      return;
    }

    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    const demoSeed = seedDemoBookings(
      connection,
      environment.DEMO_SEED_WEEK_START,
    );
    process.stdout.write(
      `Deterministic room, auth, and booking seed completed for ${demoSeed.weekStart}.\n`,
    );
  } finally {
    connection.close();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
