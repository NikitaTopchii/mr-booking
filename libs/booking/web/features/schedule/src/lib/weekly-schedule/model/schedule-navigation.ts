import {
  formatCalendarDate,
  parseCalendarDate,
} from '@mr-booking/shared-date-time';
import { startOfOfficeWeek } from '@mr-booking/booking-domain';
import type { ScheduleNavigation } from '../types/schedule.types';

export function createScheduleSearchParams(
  current: URLSearchParams | string,
  navigation: ScheduleNavigation,
): URLSearchParams {
  const query = new URLSearchParams(
    typeof current === 'string' ? current : current.toString(),
  );
  const selectedDate = parseRequiredDate(navigation.date);
  query.set('date', formatCalendarDate(selectedDate));
  query.set('week', formatCalendarDate(startOfOfficeWeek(selectedDate)));
  if (navigation.roomId) query.set('roomId', navigation.roomId);
  return query;
}

function parseRequiredDate(value: string) {
  const candidate = parseCalendarDate(value);
  if (!candidate) throw new Error('INVALID_DATE');
  return candidate;
}
