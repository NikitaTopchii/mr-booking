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

export type { BookingInterval } from './types/booking-interval.contracts';

export const OFFICE_TIME_ZONE = 'Europe/Kyiv';
export const BOOKING_SLOT_MILLISECONDS = 30 * 60 * 1000;
export const MINIMUM_BOOKING_DURATION_MILLISECONDS = BOOKING_SLOT_MILLISECONDS;
export const MAXIMUM_BOOKING_DURATION_MILLISECONDS = 4 * 60 * 60 * 1000;
export const OFFICE_OPENING_MINUTE = 9 * 60;
export const OFFICE_CLOSING_MINUTE = 19 * 60;

const officeDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OFFICE_TIME_ZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

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
  const values = new Map(
    officeDateTimeFormatter
      .formatToParts(new Date(epochMilliseconds))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: requiredPart(values, 'year'),
    month: requiredPart(values, 'month'),
    day: requiredPart(values, 'day'),
    hour: requiredPart(values, 'hour'),
    minute: requiredPart(values, 'minute'),
    second: requiredPart(values, 'second'),
  };
}

function requiredPart(
  values: ReadonlyMap<string, number>,
  key: string,
): number {
  const value = values.get(key);

  if (value === undefined || !Number.isInteger(value)) {
    throw new InvalidBookingIntervalError();
  }

  return value;
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
