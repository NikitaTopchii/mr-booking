import type { CalendarDate } from './types/calendar-date.types';

const calendarDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/u;

export function parseCalendarDate(value: string): CalendarDate | undefined {
  const match = calendarDatePattern.exec(value);
  if (!match) return undefined;

  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isGregorianCalendarDate(date) ? date : undefined;
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

export function getCalendarWeekday(date: CalendarDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function isGregorianCalendarDate(date: CalendarDate): boolean {
  if (![date.year, date.month, date.day].every(Number.isInteger)) return false;
  const resolved = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (
    resolved.getUTCFullYear() === date.year &&
    resolved.getUTCMonth() === date.month - 1 &&
    resolved.getUTCDate() === date.day
  );
}
