import { spawnSync } from 'node:child_process';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { loadRootEnvironmentFile } from '@mr-booking/shared-config/node';

const composeCommands = {
  up: ['compose', 'up', '--build', '--detach'],
  down: ['compose', 'down', '--remove-orphans'],
  reset: ['compose', 'down', '--volumes', '--remove-orphans'],
  logs: ['compose', 'logs', '--follow', '--tail=200'],
} as const;

function isComposeCommand(
  value: string | undefined,
): value is keyof typeof composeCommands {
  return value !== undefined && value in composeCommands;
}

loadRootEnvironmentFile();

const demoEnvironment = {
  ...process.env,
  NODE_ENV: 'development',
  APP_RUNTIME_MODE: 'development',
  APP_PUBLIC_URL: 'http://localhost:3000',
  EMAIL_DELIVERY_MODE: 'development',
  EXPOSE_DEVELOPMENT_VERIFICATION_LINK: 'true',
  LOG_DEVELOPMENT_VERIFICATION_LINK: 'true',
};

parseRuntimeEnvironment(demoEnvironment);

const command = process.argv[2];

if (!isComposeCommand(command)) {
  throw new Error(
    `Expected one Compose command: ${Object.keys(composeCommands).join(', ')}`,
  );
}

if (command === 'reset') {
  process.stderr.write(
    'DESTRUCTIVE RESET: removing containers and the local SQLite volume.\n',
  );
}

const result = spawnSync('docker', composeCommands[command], {
  stdio: 'inherit',
  env: demoEnvironment,
});

if (result.error) {
  process.stderr.write(`Unable to start Docker: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
