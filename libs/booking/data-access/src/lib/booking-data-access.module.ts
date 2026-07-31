import { Module } from '@nestjs/common';
import {
  BOOKING_REPOSITORY,
  BOOKING_SCHEDULE_READER,
  MY_BOOKINGS_READER,
} from '@mr-booking/booking-domain';
import { DatabaseModule, DatabaseService } from '@mr-booking/shared-database';
import { DrizzleBookingRepository } from './booking-repository';
import { DrizzleBookingScheduleReader } from './booking-schedule-reader';
import { DrizzleMyBookingsReader } from './my-bookings-reader';
import { DemoBookingSeedService } from './demo-booking-seed.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    DemoBookingSeedService,
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
  exports: [
    DemoBookingSeedService,
    BOOKING_REPOSITORY,
    BOOKING_SCHEDULE_READER,
    MY_BOOKINGS_READER,
  ],
})
export class BookingDataAccessModule {}
