import { Module } from '@nestjs/common';
import { BOOKING_REPOSITORY } from '@mr-booking/booking-domain';
import { DatabaseModule, DatabaseService } from '@mr-booking/shared-database';
import { DrizzleBookingRepository } from './booking-repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: DrizzleBookingRepository,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) =>
        new DrizzleBookingRepository(databaseService),
    },
    {
      provide: BOOKING_REPOSITORY,
      useExisting: DrizzleBookingRepository,
    },
  ],
  exports: [BOOKING_REPOSITORY],
})
export class BookingDataAccessModule {}
