import { IntlZonedDateTimeAdapter } from './intl-zoned-date-time-adapter';
import type { CalendarDate } from './types/calendar-date.types';

const adapters = new Map<string, IntlZonedDateTimeAdapter>();

export function calendarDateAt(
  instantUtc: number,
  timeZone: string,
): CalendarDate {
  const parts = adapterFor(timeZone).partsAt(instantUtc);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function adapterFor(timeZone: string): IntlZonedDateTimeAdapter {
  const existing = adapters.get(timeZone);
  if (existing) return existing;

  const adapter = new IntlZonedDateTimeAdapter(timeZone, 'later');
  adapters.set(timeZone, adapter);
  return adapter;
}
