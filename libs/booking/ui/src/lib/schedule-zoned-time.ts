import {
  IntlZonedDateTimeAdapter,
  type CalendarDate,
} from '@mr-booking/shared-date-time';

const adapters = new Map<string, IntlZonedDateTimeAdapter>();

export function calendarDateAt(
  instant: number,
  timeZone: string,
): CalendarDate {
  const parts = adapterFor(timeZone).partsAt(instant);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function zonedDateTimeToEpoch(
  date: CalendarDate,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  return adapterFor(timeZone).toUtcInstant({ date, hour, minute });
}

function adapterFor(timeZone: string): IntlZonedDateTimeAdapter {
  const existing = adapters.get(timeZone);
  if (existing) return existing;

  // Rendering needs one stable instant when a browser zone repeats a local
  // time during fall-back. Choosing the later occurrence preserves the prior
  // schedule behavior and keeps half-open ranges deterministic.
  const adapter = new IntlZonedDateTimeAdapter(timeZone, 'later');
  adapters.set(timeZone, adapter);
  return adapter;
}
