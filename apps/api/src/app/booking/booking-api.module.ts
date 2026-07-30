import { Module } from '@nestjs/common';
import { BookingFeatureModule } from '@mr-booking/booking-feature';
import { AuthModule } from '../auth/auth.module';
import { BookingsController, RoomsController } from './booking.controller';
import { BookingExceptionFilter } from './booking-exception.filter';

@Module({
  imports: [AuthModule, BookingFeatureModule],
  controllers: [RoomsController, BookingsController],
  providers: [BookingExceptionFilter],
})
export class BookingApiModule {}
