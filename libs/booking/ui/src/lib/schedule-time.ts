export const OFFICE_TIME_ZONE = 'Europe/Kyiv';
export const SLOT_DURATION_MS = 30 * 60 * 1_000;
export const OFFICE_OPEN_HOUR = 9;
export const OFFICE_CLOSE_HOUR = 19;

export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface ScheduleSlot {
  readonly id: string;
  readonly officeDate: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
}

export type SchedulePresentation = 'compact' | 'medium' | 'expanded';

export interface ScheduleRange {
  readonly weekKey: string;
  readonly selectedDate: CalendarDate;
  readonly visibleDates: readonly CalendarDate[];
  readonly slots: readonly ScheduleSlot[];
  readonly range: {
    readonly fromUtc: string;
    readonly toUtc: string;
  };
}

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string): CalendarDate | undefined {
  const match = calendarDatePattern.exec(value);

  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + 1 !== month ||
    candidate.getUTCDate() !== day
  ) {
    return undefined;
  }

  return { year, month, day };
}

export function formatCalendarDate(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(
    2,
    '0',
  )}-${String(date.day).padStart(2, '0')}`;
}

export function addCalendarDays(
  date: CalendarDate,
  amount: number,
): CalendarDate {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + amount),
  );
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

export function startOfLocalWeek(now: number, timeZone: string): CalendarDate {
  return startOfCalendarWeek(calendarDateAt(now, timeZone));
}

export function isMonday(date: CalendarDate): boolean {
  return (
    new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() === 1
  );
}

export function createScheduleWeek(
  weekKey: string,
  browserTimeZone: string,
): ScheduleRange {
  const weekStart = parseCalendarDate(weekKey);

  if (!weekStart || !isMonday(weekStart)) {
    throw new Error('INVALID_WEEK');
  }

  return createScheduleRange(weekStart, 7, browserTimeZone);
}

export function createScheduleRange(
  selectedDate: CalendarDate,
  visibleDayCount: 1 | 3 | 7,
  browserTimeZone: string,
): ScheduleRange {
  const visibleDates = Array.from({ length: visibleDayCount }, (_, index) =>
    addCalendarDays(selectedDate, index),
  );
  const firstVisibleKey = formatCalendarDate(visibleDates[0] as CalendarDate);
  const lastVisibleKey = formatCalendarDate(
    visibleDates[visibleDates.length - 1] as CalendarDate,
  );
  const slots: ScheduleSlot[] = [];

  for (let offset = -2; offset <= visibleDayCount + 1; offset += 1) {
    const officeDate = addCalendarDays(selectedDate, offset);
    const officeDateKey = formatCalendarDate(officeDate);
    const opensAt = zonedDateTimeToEpoch(
      officeDate,
      OFFICE_OPEN_HOUR,
      0,
      OFFICE_TIME_ZONE,
    );

    for (
      let startsAtUtc = opensAt;
      startsAtUtc <
      zonedDateTimeToEpoch(officeDate, OFFICE_CLOSE_HOUR, 0, OFFICE_TIME_ZONE);
      startsAtUtc += SLOT_DURATION_MS
    ) {
      const browserDateKey = formatCalendarDate(
        calendarDateAt(startsAtUtc, browserTimeZone),
      );

      if (
        browserDateKey >= firstVisibleKey &&
        browserDateKey <= lastVisibleKey
      ) {
        slots.push({
          id: `${officeDateKey}:${startsAtUtc}`,
          officeDate: officeDateKey,
          startsAtUtc,
          endsAtUtc: startsAtUtc + SLOT_DURATION_MS,
        });
      }
    }
  }

  slots.sort((left, right) => left.startsAtUtc - right.startsAtUtc);
  if (slots.length === 0) {
    throw new Error('EMPTY_WEEK');
  }

  return {
    weekKey: formatCalendarDate(startOfCalendarWeek(selectedDate)),
    selectedDate,
    visibleDates,
    slots,
    range: {
      fromUtc: new Date(
        zonedDateTimeToEpoch(selectedDate, 0, 0, browserTimeZone),
      ).toISOString(),
      toUtc: new Date(
        zonedDateTimeToEpoch(
          addCalendarDays(selectedDate, visibleDayCount),
          0,
          0,
          browserTimeZone,
        ),
      ).toISOString(),
    },
  };
}

export function startOfCalendarWeek(date: CalendarDate): CalendarDate {
  const isoDay =
    ((new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay() + 6) %
      7) +
    1;
  return addCalendarDays(date, -(isoDay - 1));
}

export function selectedDateFromUrl(
  requestedDate: string | null,
  legacyWeek: string | null,
  now: number,
  browserTimeZone: string,
): CalendarDate {
  const parsedDate = requestedDate
    ? parseCalendarDate(requestedDate)
    : undefined;
  if (parsedDate) return parsedDate;

  const today = calendarDateAt(now, browserTimeZone);
  const parsedWeek = legacyWeek ? parseCalendarDate(legacyWeek) : undefined;
  if (!parsedWeek || !isMonday(parsedWeek)) return today;

  const weekEnd = addCalendarDays(parsedWeek, 7);
  const todayKey = formatCalendarDate(today);
  return todayKey >= formatCalendarDate(parsedWeek) &&
    todayKey < formatCalendarDate(weekEnd)
    ? today
    : parsedWeek;
}

export function visibleDayCount(presentation: SchedulePresentation): 1 | 3 | 7 {
  if (presentation === 'compact') return 1;
  if (presentation === 'medium') return 3;
  return 7;
}

export function createPresentationRange(
  selectedDate: CalendarDate,
  presentation: SchedulePresentation,
  browserTimeZone: string,
): ScheduleRange {
  const rangeStart =
    presentation === 'expanded'
      ? startOfCalendarWeek(selectedDate)
      : selectedDate;
  return createScheduleRange(
    rangeStart,
    visibleDayCount(presentation),
    browserTimeZone,
  );
}

export function overlapsAbsoluteRange(
  startsAtUtc: string,
  endsAtUtc: string,
  range: ScheduleRange['range'],
): boolean {
  return (
    Date.parse(startsAtUtc) < Date.parse(range.toUtc) &&
    Date.parse(range.fromUtc) < Date.parse(endsAtUtc)
  );
}

export function currentTimePosition(
  now: number,
  firstSlot: ScheduleSlot | undefined,
  lastSlot: ScheduleSlot | undefined,
): number | undefined {
  if (
    !firstSlot ||
    !lastSlot ||
    now < firstSlot.startsAtUtc ||
    now >= lastSlot.endsAtUtc
  ) {
    return undefined;
  }
  return (now - firstSlot.startsAtUtc) / SLOT_DURATION_MS;
}

export function calendarDateAt(
  instant: number,
  timeZone: string,
): CalendarDate {
  const parts = partsAt(instant, timeZone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function zonedDateTimeToEpoch(
  date: CalendarDate,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const target = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let candidate = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = partsAt(candidate, timeZone);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate += target - actualAsUtc;
  }

  const resolved = partsAt(candidate, timeZone);

  if (
    resolved.year !== date.year ||
    resolved.month !== date.month ||
    resolved.day !== date.day ||
    resolved.hour !== hour ||
    resolved.minute !== minute
  ) {
    throw new Error('INVALID_LOCAL_TIME');
  }

  return candidate;
}

function partsAt(
  instant: number,
  timeZone: string,
): CalendarDate & { readonly hour: number; readonly minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) =>
        ['year', 'month', 'day', 'hour', 'minute'].includes(type),
      )
      .map(({ type, value }) => [type, Number(value)]),
  );

  if (
    !Number.isInteger(values['year']) ||
    !Number.isInteger(values['month']) ||
    !Number.isInteger(values['day']) ||
    !Number.isInteger(values['hour']) ||
    !Number.isInteger(values['minute'])
  ) {
    throw new Error('INVALID_TIME_ZONE');
  }

  return {
    year: values['year'] as number,
    month: values['month'] as number,
    day: values['day'] as number,
    hour: values['hour'] as number,
    minute: values['minute'] as number,
  };
}
