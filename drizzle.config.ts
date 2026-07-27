import { defineConfig } from 'drizzle-kit';
import { parseRuntimeEnvironment } from './libs/shared/config/src';
import { loadRootEnvironmentFile } from './libs/shared/config/src/node';

loadRootEnvironmentFile();
const environment = parseRuntimeEnvironment(process.env);

export default defineConfig({
  dialect: 'sqlite',
  schema: [
    './libs/rooms/infrastructure/src/lib/room-schema.ts',
    './libs/auth/infrastructure/src/lib/auth-schema.ts',
    './libs/booking/data-access/src/lib/booking-schema.ts',
  ],
  out: './drizzle/migrations',
  dbCredentials: {
    url: environment.DATABASE_PATH,
  },
});
