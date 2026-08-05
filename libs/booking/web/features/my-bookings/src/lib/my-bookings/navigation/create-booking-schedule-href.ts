import { startOfOfficeWeek } from '@mr-booking/booking-domain';
import {
  calendarDateAt,
  formatCalendarDate,
} from '@mr-booking/shared-date-time';

export function createBookingScheduleHref(
  locale: string,
  roomId: string,
  startsAtUtc: string,
  browserTimeZone: string,
): string {
  const date = calendarDateAt(Date.parse(startsAtUtc), browserTimeZone);
  const query = new URLSearchParams({
    date: formatCalendarDate(date),
    week: formatCalendarDate(startOfOfficeWeek(date)),
    roomId,
  });
  return `/${locale}/schedule?${query.toString()}`;
}
