import { BookingClientError } from '@mr-booking/booking-data-access-web';

export type ScheduleErrorKind =
  | 'conflict'
  | 'past'
  | 'outsideOfficeHours'
  | 'invalidDuration'
  | 'validation'
  | 'forbidden'
  | 'notFound'
  | 'service';

export function mapScheduleClientError(error: unknown): ScheduleErrorKind {
  if (!(error instanceof BookingClientError)) return 'service';

  switch (error.code) {
    case 'BOOKING_CONFLICT':
      return 'conflict';
    case 'BOOKING_START_NOT_IN_FUTURE':
    case 'BOOKING_NOT_CANCELLABLE':
      return 'past';
    case 'BOOKING_OUTSIDE_OFFICE_HOURS':
      return 'outsideOfficeHours';
    case 'BOOKING_INVALID_DURATION':
    case 'BOOKING_SLOT_ALIGNMENT':
      return 'invalidDuration';
    case 'BOOKING_TITLE_REQUIRED':
    case 'BOOKING_TITLE_TOO_LONG':
    case 'BOOKING_INVALID_INTERVAL':
    case 'VALIDATION_ERROR':
      return 'validation';
    case 'BOOKING_CANCELLATION_FORBIDDEN':
      return 'forbidden';
    case 'BOOKING_NOT_FOUND':
    case 'ROOM_NOT_FOUND':
      return 'notFound';
    default:
      return 'service';
  }
}
