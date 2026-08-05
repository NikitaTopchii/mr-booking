import { parseCalendarDate } from './calendar-date';
import type {
  ZonedDateTimeDisambiguation,
  ZonedDateTimeInput,
  ZonedDateTimeParts,
} from './types/zoned-date-time.types';
import { ZonedDateTimeError } from './zoned-date-time.errors';

const dayMilliseconds = 24 * 60 * 60 * 1_000;
const offsetSampleDays = [-370, -180, -2, -1, 0, 1, 2, 180, 370] as const;

export class IntlZonedDateTimeAdapter {
  private readonly formatter: Intl.DateTimeFormat;

  public constructor(
    timeZone: string,
    private readonly disambiguation: ZonedDateTimeDisambiguation,
  ) {
    try {
      this.formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
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
    } catch {
      throw new ZonedDateTimeError('INVALID_TIME_ZONE');
    }
  }

  public partsAt(instantUtc: number): ZonedDateTimeParts {
    if (
      !Number.isSafeInteger(instantUtc) ||
      !Number.isFinite(new Date(instantUtc).getTime())
    ) {
      throw new ZonedDateTimeError('INVALID_EPOCH_INSTANT');
    }
    const values = new Map(
      this.formatter
        .formatToParts(new Date(instantUtc))
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

  public toUtcInstant(input: ZonedDateTimeInput): number {
    assertValidInput(input);
    const baseline = Date.UTC(
      input.date.year,
      input.date.month - 1,
      input.date.day,
      input.hour,
      input.minute,
    );
    const offsets = new Set(
      offsetSampleDays.map((days) =>
        this.offsetAt(baseline + days * dayMilliseconds),
      ),
    );
    const candidates = [...offsets]
      .map((offset) => baseline - offset)
      .filter((candidate) => matches(this.partsAt(candidate), input))
      .sort((left, right) => left - right);

    if (candidates.length === 0) {
      throw new ZonedDateTimeError('NONEXISTENT_LOCAL_DATE_TIME');
    }
    if (candidates.length === 1) return candidates[0] as number;
    if (this.disambiguation === 'reject') {
      throw new ZonedDateTimeError('AMBIGUOUS_LOCAL_DATE_TIME');
    }
    return this.disambiguation === 'earlier'
      ? (candidates[0] as number)
      : (candidates[candidates.length - 1] as number);
  }

  private offsetAt(instantUtc: number): number {
    const parts = this.partsAt(instantUtc);
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
}

function assertValidInput(input: ZonedDateTimeInput): void {
  const dateKey = `${String(input.date.year).padStart(4, '0')}-${String(
    input.date.month,
  ).padStart(2, '0')}-${String(input.date.day).padStart(2, '0')}`;
  if (
    !parseCalendarDate(dateKey) ||
    !Number.isInteger(input.hour) ||
    input.hour < 0 ||
    input.hour > 23 ||
    !Number.isInteger(input.minute) ||
    input.minute < 0 ||
    input.minute > 59
  ) {
    throw new ZonedDateTimeError('INVALID_LOCAL_DATE_TIME');
  }
}

function matches(
  actual: ZonedDateTimeParts,
  expected: ZonedDateTimeInput,
): boolean {
  return (
    actual.year === expected.date.year &&
    actual.month === expected.date.month &&
    actual.day === expected.date.day &&
    actual.hour === expected.hour &&
    actual.minute === expected.minute &&
    actual.second === 0
  );
}

function requiredPart(
  values: ReadonlyMap<string, number>,
  key: string,
): number {
  const value = values.get(key);
  if (value === undefined || !Number.isInteger(value)) {
    throw new ZonedDateTimeError('INVALID_TIME_ZONE');
  }
  return value;
}
