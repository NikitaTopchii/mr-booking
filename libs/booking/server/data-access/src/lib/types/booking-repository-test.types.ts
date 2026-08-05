export interface ConcurrentBookingResult {
  readonly status: 'created' | 'BOOKING_CONFLICT' | 'unexpected';
  readonly bookingId: string;
}
