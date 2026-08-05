import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { AUTH_CLOCK, AUTH_ID_GENERATOR } from '@mr-booking/auth-domain';
import {
  CancelBookingHandler,
  CreateBookingHandler,
  GetMyPastBookingsHandler,
  GetMyUpcomingBookingsHandler,
  GetRoomsHandler,
  GetRoomScheduleHandler,
} from '@mr-booking/booking-application';
import {
  BOOKING_CLOCK,
  BOOKING_ID_GENERATOR,
} from '@mr-booking/booking-domain';
import { BookingDataAccessModule } from '@mr-booking/booking-data-access';
import { RoomsDataAccessModule } from '@mr-booking/rooms-data-access';
import { AuthModule } from '../auth/auth.module';
import { BookingsController, RoomsController } from './booking.controller';
import { BookingExceptionFilter } from './booking-exception.filter';

@Module({
  imports: [
    CqrsModule,
    AuthModule,
    AuthDataAccessModule,
    RoomsDataAccessModule,
    BookingDataAccessModule,
  ],
  controllers: [RoomsController, BookingsController],
  providers: [
    BookingExceptionFilter,
    CreateBookingHandler,
    CancelBookingHandler,
    GetRoomsHandler,
    GetRoomScheduleHandler,
    GetMyUpcomingBookingsHandler,
    GetMyPastBookingsHandler,
    {
      provide: BOOKING_CLOCK,
      useExisting: AUTH_CLOCK,
    },
    {
      provide: BOOKING_ID_GENERATOR,
      useExisting: AUTH_ID_GENERATOR,
    },
  ],
})
export class BookingApiModule {}
