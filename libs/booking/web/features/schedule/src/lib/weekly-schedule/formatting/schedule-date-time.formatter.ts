import type { CalendarDate } from '@mr-booking/shared-date-time';
import type { Locale } from '@mr-booking/shared-i18n';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatScheduleCalendarDate(
  date: CalendarDate,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): string {
  return getFormatter(locale, {
    ...options,
    timeZone: 'UTC',
  }).format(Date.UTC(date.year, date.month - 1, date.day));
}

export function formatScheduleInstant(
  instant: number,
  locale: Locale,
  timeZone: string,
): string {
  return getFormatter(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(instant);
}

export function formatScheduleTimeRange(
  start: number,
  end: number,
  locale: Locale,
  timeZone: string,
): string {
  const formatter = getFormatter(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

export function formatScheduleWeekRange(
  dates: readonly CalendarDate[],
  locale: Locale,
): string {
  const first = dates[0];
  const last = dates.at(-1);
  if (!first || !last) return '';
  return `${formatScheduleCalendarDate(first, locale, {
    month: 'short',
    day: 'numeric',
  })} – ${formatScheduleCalendarDate(last, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function getFormatter(
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat(locale, options);
  formatterCache.set(key, formatter);
  return formatter;
}
