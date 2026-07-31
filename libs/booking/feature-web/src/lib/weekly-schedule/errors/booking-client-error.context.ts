import { BookingClientError } from '@mr-booking/booking-data-access-web';

export function bookingClientErrorStatus(cause: unknown): number | undefined {
  return cause instanceof BookingClientError ? cause.status : undefined;
}
