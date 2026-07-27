import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

export function loadRootEnvironmentFile(
  environmentFile = resolve(process.cwd(), '.env'),
): void {
  if (existsSync(environmentFile)) {
    loadEnvFile(environmentFile);
  }
}
