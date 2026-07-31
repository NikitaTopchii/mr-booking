import type { z } from 'zod';
import type {
  bookingSchema,
  myBookingSchema,
  myBookingsResponseSchema,
  myPastBookingsResponseSchema,
  roomSchema,
} from '../booking-client.schemas';

export type Room = z.infer<typeof roomSchema>;
export type ScheduleBooking = z.infer<typeof bookingSchema>;
export type MyBooking = z.infer<typeof myBookingSchema>;
export type MyBookingsResponse = z.infer<typeof myBookingsResponseSchema>;
export type MyPastBookingsResponse = z.infer<
  typeof myPastBookingsResponseSchema
>;

export type MyPastBookingsKey = readonly [
  'booking',
  'mine',
  'past',
  cursor: string | null,
  limit: number,
];

export interface BookingRange {
  readonly fromUtc: string;
  readonly toUtc: string;
}

export interface CreateBookingInput {
  readonly roomId: string;
  readonly title: string;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
}

export type BookingClientErrorCode =
  'UNAUTHENTICATED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | string;
