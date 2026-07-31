import { BookingClientError } from '@mr-booking/booking-data-access-web';
import type { BookingCancellationErrorCode } from './booking-cancellation-error.catalog';

export function classifyBookingCancellationError(
  cause: unknown,
): BookingCancellationErrorCode {
  if (!(cause instanceof BookingClientError)) return 'service';

  switch (cause.code) {
    case 'BOOKING_NOT_CANCELLABLE':
      return 'notCancellable';
    case 'BOOKING_CANCELLATION_FORBIDDEN':
      return 'forbidden';
    case 'BOOKING_NOT_FOUND':
      return 'notFound';
    default:
      return 'service';
  }
}
