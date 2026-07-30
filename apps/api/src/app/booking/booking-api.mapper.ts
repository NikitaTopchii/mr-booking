import type { SafeUser } from '@mr-booking/auth-domain';
import type { Booking, ScheduleBooking } from '@mr-booking/booking-domain';
import type { ScheduleBookingDto } from './booking-api.schemas';

export function toScheduleBookingDto(
  booking: ScheduleBooking,
): ScheduleBookingDto {
  return {
    ...booking,
    startsAtUtc: new Date(booking.startsAtUtc).toISOString(),
    endsAtUtc: new Date(booking.endsAtUtc).toISOString(),
  };
}

export function toCreatedBookingDto(
  booking: Booking,
  author: SafeUser,
): ScheduleBookingDto {
  return toScheduleBookingDto({
    id: booking.id,
    roomId: booking.roomId,
    title: booking.title,
    startsAtUtc: booking.startsAtUtc,
    endsAtUtc: booking.endsAtUtc,
    author: {
      id: author.id,
      name: author.name,
    },
    isMine: true,
  });
}
