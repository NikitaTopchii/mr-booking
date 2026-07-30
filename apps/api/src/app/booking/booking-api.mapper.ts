import type { SafeUser } from '@mr-booking/auth-domain';
import type {
  Booking,
  MyBookingsResult,
  MyPastBookingsResult,
  ScheduleBooking,
} from '@mr-booking/booking-domain';
import type {
  MyBookingsDto,
  MyPastBookingsDto,
  ScheduleBookingDto,
} from './booking-api.schemas';
import { encodeMyBookingsCursor } from './booking-cursor';

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

export function toMyBookingsDto(result: MyBookingsResult): MyBookingsDto {
  return {
    items: result.items.map((booking) => ({
      ...booking,
      startsAtUtc: new Date(booking.startsAtUtc).toISOString(),
      endsAtUtc: new Date(booking.endsAtUtc).toISOString(),
    })),
    serverNowUtc: new Date(result.serverNowUtc).toISOString(),
  };
}

export function toMyPastBookingsDto(
  result: MyPastBookingsResult,
): MyPastBookingsDto {
  return {
    ...toMyBookingsDto(result),
    nextCursor: result.nextCursor
      ? encodeMyBookingsCursor(result.nextCursor)
      : null,
  };
}
