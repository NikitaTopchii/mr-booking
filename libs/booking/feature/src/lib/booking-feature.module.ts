import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthDataAccessModule } from '@mr-booking/auth-data-access';
import { AUTH_CLOCK, AUTH_ID_GENERATOR } from '@mr-booking/auth-domain';
import { BookingDataAccessModule } from '@mr-booking/booking-data-access';
import {
  BOOKING_CLOCK,
  BOOKING_ID_GENERATOR,
} from '@mr-booking/booking-domain';
import { RoomsDataAccessModule } from '@mr-booking/rooms-data-access';
import { CancelBookingHandler, CreateBookingHandler } from './booking-handlers';

@Module({
  imports: [
    CqrsModule,
    AuthDataAccessModule,
    RoomsDataAccessModule,
    BookingDataAccessModule,
  ],
  providers: [
    CreateBookingHandler,
    CancelBookingHandler,
    {
      provide: BOOKING_CLOCK,
      useExisting: AUTH_CLOCK,
    },
    {
      provide: BOOKING_ID_GENERATOR,
      useExisting: AUTH_ID_GENERATOR,
    },
  ],
  exports: [CqrsModule],
})
export class BookingFeatureModule {}
