import {
  BOOKING_SLOT_MILLISECONDS,
  getOfficeDateTimeParts,
  OFFICE_CLOSING_MINUTE,
  OFFICE_OPENING_MINUTE,
} from '@mr-booking/booking-domain';
import type { CreateBookingEndOptionsInput } from '../types/booking-end-options.types';
import type { ScheduleSlot } from '../types/schedule.types';

export function createBookingEndOptions(
  input: CreateBookingEndOptionsInput,
): readonly string[] {
  const selected = input.selectedSlot;
  if (input.maximumDurationSlots < 1) return [];

  const sameOfficeDay = input.slots
    .filter((slot) => isValidOfficeSlot(slot, selected.officeDate))
    .sort((left, right) => left.startsAtUtc - right.startsAtUtc)
    .filter((slot, index, slots) => {
      if (index === 0) return true;
      return slot.id !== slots[index - 1]?.id;
    });
  const selectedIndex = sameOfficeDay.findIndex(
    (slot) =>
      slot.id === selected.id &&
      slot.startsAtUtc === selected.startsAtUtc &&
      slot.endsAtUtc === selected.endsAtUtc,
  );
  if (selectedIndex < 0) return [];

  const occupiedIntervals = input.bookings
    .filter((booking) => booking.roomId === input.roomId)
    .map((booking) => ({
      startsAt: Date.parse(booking.startsAtUtc),
      endsAt: Date.parse(booking.endsAtUtc),
    }))
    .filter(
      ({ startsAt, endsAt }) =>
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        endsAt > startsAt,
    );
  const options: string[] = [];
  let expectedStart = selected.startsAtUtc;
  for (
    let index = selectedIndex;
    index < sameOfficeDay.length && options.length < input.maximumDurationSlots;
    index += 1
  ) {
    const slot = sameOfficeDay[index];
    if (!slot || slot.startsAtUtc !== expectedStart) break;
    if (
      occupiedIntervals.some(
        ({ startsAt, endsAt }) =>
          slot.startsAtUtc < endsAt && slot.endsAtUtc > startsAt,
      )
    ) {
      break;
    }
    options.push(new Date(slot.endsAtUtc).toISOString());
    expectedStart = slot.endsAtUtc;
  }
  return [...new Set(options)];
}

function isValidOfficeSlot(slot: ScheduleSlot, officeDate: string): boolean {
  if (
    slot.officeDate !== officeDate ||
    !isValidEpoch(slot.startsAtUtc) ||
    !isValidEpoch(slot.endsAtUtc) ||
    slot.endsAtUtc - slot.startsAtUtc !== BOOKING_SLOT_MILLISECONDS
  ) {
    return false;
  }
  const startsAt = getOfficeDateTimeParts(slot.startsAtUtc);
  const endsAt = getOfficeDateTimeParts(slot.endsAtUtc);
  return (
    `${startsAt.year.toString().padStart(4, '0')}-${startsAt.month
      .toString()
      .padStart(2, '0')}-${startsAt.day.toString().padStart(2, '0')}` ===
      officeDate &&
    startsAt.hour * 60 + startsAt.minute >= OFFICE_OPENING_MINUTE &&
    startsAt.hour * 60 + startsAt.minute < OFFICE_CLOSING_MINUTE &&
    endsAt.hour * 60 + endsAt.minute <= OFFICE_CLOSING_MINUTE &&
    `${endsAt.year.toString().padStart(4, '0')}-${endsAt.month
      .toString()
      .padStart(2, '0')}-${endsAt.day.toString().padStart(2, '0')}` ===
      officeDate
  );
}

function isValidEpoch(value: number): boolean {
  return (
    Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime())
  );
}
