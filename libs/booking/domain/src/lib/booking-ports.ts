import type { Booking } from './booking-contracts';

export const BOOKING_REPOSITORY = Symbol('BOOKING_REPOSITORY');
export const BOOKING_CLOCK = Symbol('BOOKING_CLOCK');
export const BOOKING_ID_GENERATOR = Symbol('BOOKING_ID_GENERATOR');

export interface BookingWriteTransaction {
  createBookingWithSlots(
    booking: Booking,
    slotStartsAtUtc: readonly number[],
  ): void;
  findBookingForCancellation(bookingId: string): Booking | null;
  cancelBookingAndReleaseSlots(bookingId: string, cancelledAtUtc: number): void;
}

export interface BookingRepository {
  withImmediateTransaction<T>(
    operation: (transaction: BookingWriteTransaction) => T,
  ): T;
}

export interface BookingClock {
  now(): number;
}

export interface BookingIdGenerator {
  generate(): string;
}
