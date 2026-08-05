import type { FormatBookingDateTimeRangeInput } from './types/booking-date-time.types';

export function formatBookingDateTimeRange({
  startsAtUtc,
  endsAtUtc,
  locale,
  timeZone,
}: FormatBookingDateTimeRangeInput): string {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
  const startsAt = Date.parse(startsAtUtc);
  const endsAt = Date.parse(endsAtUtc);
  const startDate = dateFormatter.format(startsAt);
  const endDate = dateFormatter.format(endsAt);

  if (startDate === endDate) {
    return `${startDate} · ${timeFormatter.format(startsAt)}–${timeFormatter.format(endsAt)}`;
  }

  return `${startDate} · ${timeFormatter.format(startsAt)}–${endDate} · ${timeFormatter.format(endsAt)}`;
}
