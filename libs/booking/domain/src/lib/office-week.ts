import {
  addCalendarDays,
  getCalendarWeekday,
  type CalendarDate,
} from '@mr-booking/shared-date-time';

const mondayWeekday = 1;

export function isOfficeWeekStart(date: CalendarDate): boolean {
  return getCalendarWeekday(date) === mondayWeekday;
}

export function startOfOfficeWeek(date: CalendarDate): CalendarDate {
  const daysSinceMonday = (getCalendarWeekday(date) + 6) % 7;
  return addCalendarDays(date, -daysSinceMonday);
}

export function getNextOfficeWeekStart(date: CalendarDate): CalendarDate {
  const daysUntilNextMonday = (8 - getCalendarWeekday(date)) % 7 || 7;
  return addCalendarDays(date, daysUntilNextMonday);
}
