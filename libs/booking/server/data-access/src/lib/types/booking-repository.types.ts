import type { DatabaseConnection } from '@mr-booking/shared-database';

export interface DatabaseConnectionProvider {
  readonly connection: DatabaseConnection;
}
