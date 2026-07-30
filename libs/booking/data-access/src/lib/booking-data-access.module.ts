import { Module } from '@nestjs/common';
import {
  BOOKING_REPOSITORY,
  BOOKING_SCHEDULE_READER,
  MY_BOOKINGS_READER,
} from '@mr-booking/booking-domain';
import { DatabaseModule, DatabaseService } from '@mr-booking/shared-database';
import {
  DrizzleBookingRepository,
  DrizzleBookingScheduleReader,
  DrizzleMyBookingsReader,
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
    {
      provide: DrizzleMyBookingsReader,
      inject: [DatabaseService],
      useFactory: (databaseService: DatabaseService) =>
        new DrizzleMyBookingsReader(databaseService),
    },
    {
      provide: MY_BOOKINGS_READER,
      useExisting: DrizzleMyBookingsReader,
    },
  ],
  exports: [BOOKING_REPOSITORY, BOOKING_SCHEDULE_READER, MY_BOOKINGS_READER],
})
export class BookingDataAccessModule {}
