export const validatedBookingInterval = Symbol('validatedBookingInterval');

export interface BookingInterval {
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly [validatedBookingInterval]: true;
}

export interface OfficeDateTime {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}
