import { BookingClientError } from '@mr-booking/booking-data-access-web';
import type { BookingCreationErrorCode } from './booking-creation-error.catalog';

export function classifyBookingCreationError(
  cause: unknown,
): BookingCreationErrorCode {
  if (!(cause instanceof BookingClientError)) return 'service';

  switch (cause.code) {
    case 'BOOKING_CONFLICT':
      return 'conflict';
    case 'BOOKING_START_NOT_IN_FUTURE':
      return 'startNotInFuture';
    case 'BOOKING_OUTSIDE_OFFICE_HOURS':
      return 'outsideOfficeHours';
    case 'BOOKING_INVALID_DURATION':
      return 'invalidDuration';
    case 'BOOKING_SLOT_ALIGNMENT':
      return 'invalidSlotAlignment';
    case 'BOOKING_TITLE_REQUIRED':
    case 'BOOKING_TITLE_TOO_LONG':
      return 'invalidTitle';
    case 'BOOKING_INVALID_INTERVAL':
    case 'VALIDATION_ERROR':
      return 'validation';
    case 'ROOM_NOT_FOUND':
      return 'roomNotFound';
    default:
      return 'service';
  }
}
