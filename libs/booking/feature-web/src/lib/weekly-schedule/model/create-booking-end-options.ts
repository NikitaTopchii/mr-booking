import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import type { ScheduleBooking } from '@mr-booking/booking-data-access-web';
import type { ScheduleSlot } from '@mr-booking/booking-ui';
import { MAX_BOOKING_SLOT_COUNT } from '../constants/schedule.constants';

export function createBookingEndOptions(
  selected: ScheduleSlot,
  slots: readonly ScheduleSlot[],
  bookings: readonly ScheduleBooking[],
): readonly string[] {
  const sameOfficeDay = slots
    .filter(
      (slot) =>
        slot.officeDate === selected.officeDate &&
        slot.startsAtUtc >= selected.startsAtUtc,
    )
    .sort((left, right) => left.startsAtUtc - right.startsAtUtc);
  const occupiedStarts = new Set(
    bookings.flatMap((booking) => {
      const startsAt = Date.parse(booking.startsAtUtc);
      const endsAt = Date.parse(booking.endsAtUtc);
      return sameOfficeDay
        .filter(
          (slot) => slot.startsAtUtc >= startsAt && slot.startsAtUtc < endsAt,
        )
        .map((slot) => slot.startsAtUtc);
    }),
  );
  const options: string[] = [];
  for (const [index, slot] of sameOfficeDay.entries()) {
    if (index >= MAX_BOOKING_SLOT_COUNT) break;
    if (
      slot.startsAtUtc > selected.startsAtUtc &&
      occupiedStarts.has(slot.startsAtUtc)
    ) {
      break;
    }
    options.push(new Date(slot.endsAtUtc).toISOString());
  }
  return options;
}

export function defaultBookingEnd(selected: ScheduleSlot): string {
  return new Date(
    selected.startsAtUtc + BOOKING_SLOT_MILLISECONDS,
  ).toISOString();
}
