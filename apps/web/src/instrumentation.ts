import { parseRuntimeEnvironment } from '@mr-booking/shared-config';

export function register(): void {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    parseRuntimeEnvironment(process.env);
  }
}
