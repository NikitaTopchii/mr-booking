import { Module } from '@nestjs/common';
import { DatabaseModule } from '@mr-booking/shared-database';
import { RoomsDataAccessModule } from '@mr-booking/rooms-data-access';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { BookingFeatureModule } from '@mr-booking/booking-feature';
import { FoundationStartupService } from './foundation-startup.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule,
    RoomsDataAccessModule,
    AuthDataAccessModule,
    AuthModule,
    BookingFeatureModule,
    HealthModule,
  ],
  providers: [FoundationStartupService],
})
export class AppModule {}
