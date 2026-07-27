import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { parseRuntimeEnvironment } from '@mr-booking/shared-config';
import { loadRootEnvironmentFile } from '@mr-booking/shared-config/node';
import { DatabaseConnection, openDatabase } from './database-connection';
import { applyMigrations } from './migrations';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private activeConnection: DatabaseConnection | undefined;
  private migrationsCompleted = false;

  public get connection(): DatabaseConnection {
    if (!this.activeConnection || !this.migrationsCompleted) {
      throw new Error('Database initialization has not completed');
    }

    return this.activeConnection;
  }

  public onModuleInit(): void {
    loadRootEnvironmentFile();
    const environment = parseRuntimeEnvironment(process.env);
    const connection = openDatabase(environment.DATABASE_PATH);

    try {
      applyMigrations(connection);
      this.activeConnection = connection;
      this.migrationsCompleted = true;
    } catch (error) {
      connection.close();
      throw error;
    }
  }

  public onModuleDestroy(): void {
    this.activeConnection?.close();
    this.activeConnection = undefined;
    this.migrationsCompleted = false;
  }

  public assertReady(): void {
    this.connection.assertHealthy();
  }
}
