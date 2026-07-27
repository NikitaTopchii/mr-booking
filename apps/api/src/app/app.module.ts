import { Module } from '@nestjs/common';
import { DatabaseModule } from '@mr-booking/shared-database';
import { RoomsDataAccessModule } from '@mr-booking/rooms-data-access';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { FoundationStartupService } from './foundation-startup.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule,
    RoomsDataAccessModule,
    AuthDataAccessModule,
    AuthModule,
    HealthModule,
  ],
  providers: [FoundationStartupService],
})
export class AppModule {}
