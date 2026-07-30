import type { RoomBookingInterval } from './types/booking-overlap.types';

export type { RoomBookingInterval } from './types/booking-overlap.types';

export function bookingIntervalsOverlap(
  first: RoomBookingInterval,
  second: RoomBookingInterval,
): boolean {
  return (
    first.roomId === second.roomId &&
    first.startsAtUtc < second.endsAtUtc &&
    second.startsAtUtc < first.endsAtUtc
  );
}
