import { Module } from '@nestjs/common';
import { DatabaseModule } from '@mr-booking/shared-database';
import { RoomsDataAccessModule } from '@mr-booking/rooms-data-access';
import { FoundationStartupService } from './foundation-startup.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [DatabaseModule, RoomsDataAccessModule, HealthModule],
  providers: [FoundationStartupService],
})
export class AppModule {}
