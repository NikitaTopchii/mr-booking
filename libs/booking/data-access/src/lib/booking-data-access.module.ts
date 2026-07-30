import { Module } from '@nestjs/common';
import {
  BOOKING_REPOSITORY,
  BOOKING_SCHEDULE_READER,
} from '@mr-booking/booking-domain';
import { DatabaseModule, DatabaseService } from '@mr-booking/shared-database';
import {
  DrizzleBookingRepository,
  DrizzleBookingScheduleReader,
} from './booking-repository';

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
    {
      provide: DrizzleBookingScheduleReader,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) =>
        new DrizzleBookingScheduleReader(databaseService),
    },
    {
      provide: BOOKING_SCHEDULE_READER,
      useExisting: DrizzleBookingScheduleReader,
    },
  ],
  exports: [BOOKING_REPOSITORY, BOOKING_SCHEDULE_READER],
})
export class BookingDataAccessModule {}
