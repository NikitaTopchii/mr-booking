import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { DatabaseService } from './database.service';

@Injectable()
export class SqliteHealthIndicator {
  public constructor(
    private readonly indicatorService: HealthIndicatorService,
    private readonly databaseService: DatabaseService,
  ) {}

  public check(key = 'database'): HealthIndicatorResult {
    const indicator = this.indicatorService.check(key);

    try {
      this.databaseService.assertReady();
      return indicator.up();
    } catch {
      return indicator.down('SQLite is not ready');
    }
  }
}
