import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SqliteHealthIndicator } from '@mr-booking/shared-database';
import type { LivenessResponse } from './types/health.types';

@Controller('health')
export class HealthController {
  public constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly sqliteHealthIndicator: SqliteHealthIndicator,
  ) {}

  @Get('live')
  public liveness(): LivenessResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  public readiness() {
    return this.healthCheckService.check([
      () => this.sqliteHealthIndicator.check(),
    ]);
  }
}
