import {
  BOOKING_SLOT_MILLISECONDS,
  type BookingInterval,
} from './booking-interval';

export function generateBookingSlotStarts(
  interval: BookingInterval,
): readonly number[] {
  const slotStarts: number[] = [];

  for (
    let slotStartsAtUtc = interval.startsAtUtc;
    slotStartsAtUtc < interval.endsAtUtc;
    slotStartsAtUtc += BOOKING_SLOT_MILLISECONDS
  ) {
    slotStarts.push(slotStartsAtUtc);
  }

  return slotStarts;
}
