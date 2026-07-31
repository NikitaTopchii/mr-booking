import {
  isOfficeWeekStart,
  startOfOfficeWeek,
} from '@mr-booking/booking-domain';
import {
  addCalendarDays,
  formatCalendarDate,
  parseCalendarDate,
  type CalendarDate,
} from '@mr-booking/shared-date-time';
import { calendarDateAt } from './schedule-zoned-time';

export function startOfLocalWeek(now: number, timeZone: string): CalendarDate {
  return startOfOfficeWeek(calendarDateAt(now, timeZone));
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
  if (!parsedWeek || !isOfficeWeekStart(parsedWeek)) return today;

  const weekEnd = addCalendarDays(parsedWeek, 7);
  const todayKey = formatCalendarDate(today);
  return todayKey >= formatCalendarDate(parsedWeek) &&
    todayKey < formatCalendarDate(weekEnd)
    ? today
    : parsedWeek;
}
