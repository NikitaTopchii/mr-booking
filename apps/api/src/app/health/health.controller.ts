import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SqliteHealthIndicator } from '@mr-booking/shared-database';

@Controller('health')
export class HealthController {
  public constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly sqliteHealthIndicator: SqliteHealthIndicator,
  ) {}

  @Get('live')
  public liveness(): { readonly status: 'ok' } {
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
