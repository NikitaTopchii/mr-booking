import { BookingClientError } from '@mr-booking/booking-data-access-web';
import type { ScheduleQueryErrorCode } from './schedule-query-error.catalog';

export function classifyScheduleQueryError(
  cause: unknown,
): ScheduleQueryErrorCode {
  if (!(cause instanceof BookingClientError)) return 'service';

  switch (cause.code) {
    case 'ROOM_NOT_FOUND':
      return 'roomNotFound';
    default:
      return 'service';
  }
}
