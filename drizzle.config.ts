import { defineConfig } from 'drizzle-kit';
import { parseRuntimeEnvironment } from './libs/shared/config/src';
import { loadRootEnvironmentFile } from './libs/shared/config/src/node';

loadRootEnvironmentFile();
const environment = parseRuntimeEnvironment(process.env);

export default defineConfig({
  dialect: 'sqlite',
  schema: [
    './libs/rooms/infrastructure/src/schema.ts',
    './libs/auth/infrastructure/src/schema.ts',
    './libs/booking/infrastructure/src/schema.ts',
  ],
  out: './drizzle/migrations',
  dbCredentials: {
    url: environment.DATABASE_PATH,
  },
});
