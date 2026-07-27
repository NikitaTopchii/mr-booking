import { spawnSync } from 'node:child_process';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { loadRootEnvironmentFile } from '@mr-booking/shared-config/node';
import { applyMigrations, openDatabase } from '@mr-booking/shared-database';
import { seedRooms } from '@mr-booking/rooms-data-access';

loadRootEnvironmentFile();
const environment = parseRuntimeEnvironment(process.env);
const connection = openDatabase(environment.DATABASE_PATH);

try {
  applyMigrations(connection);

  if (environment.SEED_ON_START) {
    seedRooms(connection);
  }
} finally {
  connection.close();
}

const nxCommand = process.platform === 'win32' ? 'nx.cmd' : 'nx';
const result = spawnSync(
  nxCommand,
  [
    'run-many',
    '--target=dev',
    '--projects=web,api',
    '--parallel=2',
    '--outputStyle=stream',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      API_INTERNAL_PORT: String(environment.API_INTERNAL_PORT),
      PORT: String(environment.WEB_INTERNAL_PORT),
    },
  },
);

if (result.error) {
  process.stderr.write(`Unable to start Nx: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
