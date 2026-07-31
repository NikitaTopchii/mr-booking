import {
  BookingOutsideOfficeHoursError,
  BookingSlotAlignmentError,
  BookingStartNotInFutureError,
  InvalidBookingDurationError,
  InvalidBookingIntervalError,
} from './booking-errors';
import {
  validatedBookingInterval,
  type BookingInterval,
  type OfficeDateTime,
} from './types/booking-interval.contracts';
import { getOfficeDateTimeParts } from './office-date-time';

export type { BookingInterval } from './types/booking-interval.contracts';
export { OFFICE_TIME_ZONE } from './office-date-time';

export const BOOKING_SLOT_MILLISECONDS = 30 * 60 * 1000;
export const MINIMUM_BOOKING_DURATION_MILLISECONDS = BOOKING_SLOT_MILLISECONDS;
export const MAXIMUM_BOOKING_DURATION_MILLISECONDS = 4 * 60 * 60 * 1000;
export const OFFICE_OPENING_MINUTE = 9 * 60;
export const OFFICE_CLOSING_MINUTE = 19 * 60;

export function validateBookingInterval(
  startsAtUtc: number,
  endsAtUtc: number,
  nowUtc: number,
): BookingInterval {
  if (
    !isValidEpochMilliseconds(startsAtUtc) ||
    !isValidEpochMilliseconds(endsAtUtc) ||
    !isValidEpochMilliseconds(nowUtc) ||
    endsAtUtc <= startsAtUtc
  ) {
    throw new InvalidBookingIntervalError();
  }

  if (startsAtUtc <= nowUtc) {
    throw new BookingStartNotInFutureError();
  }

  const durationMilliseconds = endsAtUtc - startsAtUtc;

  if (
    durationMilliseconds < MINIMUM_BOOKING_DURATION_MILLISECONDS ||
    durationMilliseconds > MAXIMUM_BOOKING_DURATION_MILLISECONDS ||
    durationMilliseconds % BOOKING_SLOT_MILLISECONDS !== 0
  ) {
    throw new InvalidBookingDurationError();
  }

  const officeStart = toOfficeDateTime(startsAtUtc);
  const officeEnd = toOfficeDateTime(endsAtUtc);

  if (
    !isAlignedBoundary(officeStart, startsAtUtc) ||
    !isAlignedBoundary(officeEnd, endsAtUtc)
  ) {
    throw new BookingSlotAlignmentError();
  }

  const startMinute = officeStart.hour * 60 + officeStart.minute;
  const endMinute = officeEnd.hour * 60 + officeEnd.minute;

  if (
    !isSameOfficeDate(officeStart, officeEnd) ||
    startMinute < OFFICE_OPENING_MINUTE ||
    endMinute > OFFICE_CLOSING_MINUTE
  ) {
    throw new BookingOutsideOfficeHoursError();
  }

  return {
    startsAtUtc,
    endsAtUtc,
    [validatedBookingInterval]: true,
  };
}

function isValidEpochMilliseconds(value: number): boolean {
  return (
    Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime())
  );
}

function toOfficeDateTime(epochMilliseconds: number): OfficeDateTime {
  return getOfficeDateTimeParts(epochMilliseconds);
}

function isAlignedBoundary(
  officeDateTime: OfficeDateTime,
  epochMilliseconds: number,
): boolean {
  return (
    officeDateTime.minute % 30 === 0 &&
    officeDateTime.second === 0 &&
    epochMilliseconds % 1000 === 0
  );
}

function isSameOfficeDate(
  first: OfficeDateTime,
  second: OfficeDateTime,
): boolean {
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day
  );
}
