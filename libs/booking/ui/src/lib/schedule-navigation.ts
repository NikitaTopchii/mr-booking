import {
  calendarDateAt,
  formatCalendarDate,
  parseCalendarDate,
  startOfCalendarWeek,
} from './schedule-time';

export interface ScheduleNavigation {
  readonly roomId?: string;
  readonly date: string;
}

export function createScheduleSearchParams(
  current: URLSearchParams | string,
  navigation: ScheduleNavigation,
): URLSearchParams {
  const query = new URLSearchParams(
    typeof current === 'string' ? current : current.toString(),
  );
  const selectedDate = parseRequiredDate(navigation.date);
  query.set('date', formatCalendarDate(selectedDate));
  query.set('week', formatCalendarDate(startOfCalendarWeek(selectedDate)));
  if (navigation.roomId) query.set('roomId', navigation.roomId);
  return query;
}

export function createScheduleBookingHref(
  locale: string,
  roomId: string,
  startsAtUtc: string,
  browserTimeZone: string,
): string {
  const date = formatCalendarDate(
    calendarDateAt(Date.parse(startsAtUtc), browserTimeZone),
  );
  const query = createScheduleSearchParams('', { roomId, date });
  return `/${locale}/schedule?${query.toString()}`;
}

function parseRequiredDate(value: string) {
  const candidate = parseCalendarDate(value);
  if (!candidate) throw new Error('INVALID_DATE');
  return candidate;
}
