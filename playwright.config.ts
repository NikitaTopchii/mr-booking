import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defineConfig, devices } from '@playwright/test';

const databasePath = join(
  tmpdir(),
  `mr-booking-auth-e2e-${process.pid}.sqlite`,
);
const webPort = 3101;
const apiPort = 3102;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node tools/scripts/e2e-development.mjs',
    url: `http://localhost:${webPort}/uk/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: {
      signal: 'SIGTERM',
      timeout: 5_000,
    },
    env: {
      ...process.env,
      NODE_ENV: 'test',
      E2E_RUNTIME: 'true',
      WEB_INTERNAL_PORT: String(webPort),
      API_INTERNAL_PORT: String(apiPort),
      API_INTERNAL_URL: `http://localhost:${apiPort}`,
      WEB_ORIGIN: `http://localhost:${webPort}`,
      DATABASE_PATH: databasePath,
      SEED_ON_START: 'true',
      SESSION_COOKIE_NAME: 'room_booking_session',
      SESSION_TTL_DAYS: '7',
    },
  },
});
