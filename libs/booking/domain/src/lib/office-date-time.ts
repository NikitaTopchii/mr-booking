import type {
  OfficeCalendarDate,
  OfficeDateTimeInput,
  OfficeDateTimeParts,
} from './types/office-date-time.contracts';

export const OFFICE_TIME_ZONE = 'Europe/Kyiv';

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;
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

export class InvalidOfficeDateTimeError extends Error {
  public constructor() {
    super('INVALID_OFFICE_DATE_TIME');
    this.name = 'InvalidOfficeDateTimeError';
  }
}

export function parseOfficeCalendarDate(
  value: string,
): OfficeCalendarDate | undefined {
  const match = calendarDatePattern.exec(value);

  if (!match) {
    return undefined;
  }

  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  return isGregorianCalendarDate(date) ? date : undefined;
}

export function formatOfficeCalendarDate(date: OfficeCalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(
    2,
    '0',
  )}-${String(date.day).padStart(2, '0')}`;
}

export function addOfficeCalendarDays(
  date: OfficeCalendarDate,
  amount: number,
): OfficeCalendarDate {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + amount),
  );

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

export function isOfficeCalendarMonday(date: OfficeCalendarDate): boolean {
  return (
    new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 1
  );
}

export function getOfficeCalendarDate(instantUtc: number): OfficeCalendarDate {
  const parts = getOfficeDateTimeParts(instantUtc);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getOfficeDateTimeParts(
  instantUtc: number,
): OfficeDateTimeParts {
  if (!isValidEpochMilliseconds(instantUtc)) {
    throw new InvalidOfficeDateTimeError();
  }

  const values = new Map(
    officeDateTimeFormatter
      .formatToParts(new Date(instantUtc))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: requiredDateTimePart(values, 'year'),
    month: requiredDateTimePart(values, 'month'),
    day: requiredDateTimePart(values, 'day'),
    hour: requiredDateTimePart(values, 'hour'),
    minute: requiredDateTimePart(values, 'minute'),
    second: requiredDateTimePart(values, 'second'),
  };
}

export function officeDateTimeToUtcInstant(input: OfficeDateTimeInput): number {
  assertValidOfficeDateTime(input);
  return resolveOfficeDateTimeUtcInstant(input);
}

function resolveOfficeDateTimeUtcInstant(input: OfficeDateTimeInput): number {
  // Date.UTC provides a numeric baseline for the local wall-clock fields. The
  // fields still represent Europe/Kyiv time until its named-zone offset is
  // applied below.
  const localWallClockBaselineUtc = Date.UTC(
    input.date.year,
    input.date.month - 1,
    input.date.day,
    input.hour,
    input.minute,
  );
  const initialUtcCandidate = applyOfficeOffset(
    localWallClockBaselineUtc,
    localWallClockBaselineUtc,
  );

  if (matchesOfficeDateTime(initialUtcCandidate, input)) {
    return initialUtcCandidate;
  }

  // The baseline and its first candidate can fall on opposite sides of a DST
  // transition. Reapply the offset observed at the candidate, then verify the
  // original local fields so nonexistent local times cannot pass silently.
  const dstAdjustedUtcCandidate = applyOfficeOffset(
    localWallClockBaselineUtc,
    initialUtcCandidate,
  );

  if (matchesOfficeDateTime(dstAdjustedUtcCandidate, input)) {
    return dstAdjustedUtcCandidate;
  }

  throw new InvalidOfficeDateTimeError();
}

function assertValidOfficeDateTime(input: OfficeDateTimeInput): void {
  if (
    !isGregorianCalendarDate(input.date) ||
    !Number.isInteger(input.hour) ||
    input.hour < 0 ||
    input.hour > 23 ||
    !Number.isInteger(input.minute) ||
    input.minute < 0 ||
    input.minute > 59
  ) {
    throw new InvalidOfficeDateTimeError();
  }
}

function applyOfficeOffset(
  localWallClockBaselineUtc: number,
  offsetReferenceInstantUtc: number,
): number {
  return (
    localWallClockBaselineUtc -
    getOfficeUtcOffsetMilliseconds(offsetReferenceInstantUtc)
  );
}

function getOfficeUtcOffsetMilliseconds(instantUtc: number): number {
  const parts = getOfficeDateTimeParts(instantUtc);

  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - instantUtc
  );
}

function matchesOfficeDateTime(
  instantUtc: number,
  expected: OfficeDateTimeInput,
): boolean {
  const actual = getOfficeDateTimeParts(instantUtc);

  return (
    actual.year === expected.date.year &&
    actual.month === expected.date.month &&
    actual.day === expected.date.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === 0
  );
}

function isGregorianCalendarDate(date: OfficeCalendarDate): boolean {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day)
  ) {
    return false;
  }

  const resolved = new Date(Date.UTC(date.year, date.month - 1, date.day));

  return (
    resolved.getUTCFullYear() === date.year &&
    resolved.getUTCMonth() === date.month - 1 &&
    resolved.getUTCDate() === date.day
  );
}

function isValidEpochMilliseconds(value: number): boolean {
  return (
    Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime())
  );
}

function requiredDateTimePart(
  values: ReadonlyMap<string, number>,
  key: string,
): number {
  const value = values.get(key);

  if (value === undefined || !Number.isInteger(value)) {
    throw new InvalidOfficeDateTimeError();
  }

  return value;
}
