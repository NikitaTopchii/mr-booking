import { spawn } from 'node:child_process';
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
let shutdownSignal: NodeJS.Signals | undefined;
let forceShutdownTimer: NodeJS.Timeout | undefined;
const developmentProcess = spawn(
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
    detached: process.platform !== 'win32',
    env: {
      ...process.env,
      API_INTERNAL_PORT: String(environment.API_INTERNAL_PORT),
      PORT: String(environment.WEB_INTERNAL_PORT),
    },
  },
);

developmentProcess.once('error', (error) => {
  process.stderr.write(`Unable to start Nx: ${error.message}\n`);
  process.exitCode = 1;
});

developmentProcess.once('exit', (code, signal) => {
  if (forceShutdownTimer) {
    clearTimeout(forceShutdownTimer);
  }

  if (shutdownSignal) {
    process.exitCode = 0;
    return;
  }

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});

const signalDevelopmentProcess = (signal: NodeJS.Signals): void => {
  try {
    if (process.platform !== 'win32' && developmentProcess.pid) {
      process.kill(-developmentProcess.pid, signal);
    } else {
      developmentProcess.kill(signal);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
      throw error;
    }
  }
};

for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    if (shutdownSignal) {
      return;
    }

    shutdownSignal = signal;
    signalDevelopmentProcess(signal);
    forceShutdownTimer = setTimeout(() => {
      signalDevelopmentProcess('SIGKILL');
      process.exit(0);
    }, 3_000);
  });
}
