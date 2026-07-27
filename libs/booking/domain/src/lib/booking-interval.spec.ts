import {
  BookingOutsideOfficeHoursError,
  BookingSlotAlignmentError,
  BookingStartNotInFutureError,
  InvalidBookingDurationError,
  InvalidBookingIntervalError,
} from './booking-errors';
import {
  BOOKING_SLOT_MILLISECONDS,
  OFFICE_TIME_ZONE,
  validateBookingInterval,
} from './booking-interval';

const nowUtc = Date.UTC(2026, 0, 10, 0);

describe('booking interval', () => {
  it.each([
    [Number.NaN, Date.UTC(2026, 0, 10, 8)],
    [Date.UTC(2026, 0, 10, 8), Number.POSITIVE_INFINITY],
    [Date.UTC(2026, 0, 10, 9), Date.UTC(2026, 0, 10, 8)],
    [Date.UTC(2026, 0, 10, 9), Date.UTC(2026, 0, 10, 9)],
  ])('rejects invalid absolute boundaries', (startsAtUtc, endsAtUtc) => {
    expect(() =>
      validateBookingInterval(startsAtUtc, endsAtUtc, nowUtc),
    ).toThrow(InvalidBookingIntervalError);
  });

  it('requires the start to be strictly later than the server clock', () => {
    const startsAtUtc = Date.UTC(2026, 0, 10, 7);

    expect(() =>
      validateBookingInterval(
        startsAtUtc,
        startsAtUtc + BOOKING_SLOT_MILLISECONDS,
        startsAtUtc,
      ),
    ).toThrow(BookingStartNotInFutureError);
    expect(() =>
      validateBookingInterval(
        startsAtUtc,
        startsAtUtc + BOOKING_SLOT_MILLISECONDS,
        startsAtUtc + 1,
      ),
    ).toThrow(BookingStartNotInFutureError);
  });

  it('accepts a future start', () => {
    const startsAtUtc = Date.UTC(2026, 0, 10, 7);

    expect(
      validateBookingInterval(
        startsAtUtc,
        startsAtUtc + BOOKING_SLOT_MILLISECONDS,
        startsAtUtc - 1,
      ),
    ).toEqual(expect.objectContaining({ startsAtUtc }));
  });

  it.each([
    [29 * 60 * 1000, '29 minutes'],
    [4 * 60 * 60 * 1000 + BOOKING_SLOT_MILLISECONDS, 'over four hours'],
    [45 * 60 * 1000, 'not divisible by 30 minutes'],
  ])('rejects an invalid duration: %s', (durationMilliseconds) => {
    const startsAtUtc = Date.UTC(2026, 0, 10, 7);

    expect(() =>
      validateBookingInterval(
        startsAtUtc,
        startsAtUtc + durationMilliseconds,
        nowUtc,
      ),
    ).toThrow(InvalidBookingDurationError);
  });

  it.each([BOOKING_SLOT_MILLISECONDS, 4 * 60 * 60 * 1000])(
    'accepts an inclusive duration boundary of %i milliseconds',
    (durationMilliseconds) => {
      const startsAtUtc = Date.UTC(2026, 0, 10, 7);

      expect(() =>
        validateBookingInterval(
          startsAtUtc,
          startsAtUtc + durationMilliseconds,
          nowUtc,
        ),
      ).not.toThrow();
    },
  );

  it.each([
    [Date.UTC(2026, 0, 10, 7, 15), Date.UTC(2026, 0, 10, 7, 45)],
    [Date.UTC(2026, 0, 10, 7, 0, 0, 500), Date.UTC(2026, 0, 10, 7, 30, 0, 500)],
  ])('rejects boundaries outside the office half-hour grid', (start, end) => {
    expect(() => validateBookingInterval(start, end, nowUtc)).toThrow(
      BookingSlotAlignmentError,
    );
  });

  it.each([
    [Date.UTC(2026, 0, 10, 7), Date.UTC(2026, 0, 10, 7, 30), '09:00–09:30'],
    [Date.UTC(2026, 0, 10, 7), Date.UTC(2026, 0, 10, 11), '09:00–13:00'],
    [Date.UTC(2026, 0, 10, 16, 30), Date.UTC(2026, 0, 10, 17), '18:30–19:00'],
  ])('accepts Kyiv office interval %s', (start, end) => {
    expect(() => validateBookingInterval(start, end, nowUtc)).not.toThrow();
  });

  it.each([
    [Date.UTC(2026, 0, 10, 6, 30), Date.UTC(2026, 0, 10, 7), 'before opening'],
    [
      Date.UTC(2026, 0, 10, 16, 30),
      Date.UTC(2026, 0, 10, 17, 30),
      'after closing',
    ],
    [
      Date.UTC(2026, 0, 10, 21, 30),
      Date.UTC(2026, 0, 10, 22, 30),
      'crossing an office-local date',
    ],
  ])('rejects an interval %s', (start, end) => {
    expect(() => validateBookingInterval(start, end, nowUtc)).toThrow(
      BookingOutsideOfficeHoursError,
    );
  });

  it('uses Europe/Kyiv rather than the machine timezone', () => {
    expect(OFFICE_TIME_ZONE).toBe('Europe/Kyiv');
    expect(() =>
      validateBookingInterval(
        Date.UTC(2026, 0, 10, 7),
        Date.UTC(2026, 0, 10, 7, 30),
        nowUtc,
      ),
    ).not.toThrow();
  });

  it.each([
    [
      Date.UTC(2026, 2, 29, 6),
      Date.UTC(2026, 2, 29, 6, 30),
      'spring DST offset',
    ],
    [
      Date.UTC(2026, 9, 25, 7),
      Date.UTC(2026, 9, 25, 7, 30),
      'autumn DST offset',
    ],
  ])('accepts 09:00 Kyiv around the %s', (start, end) => {
    expect(() => validateBookingInterval(start, end, nowUtc)).not.toThrow();
  });
});
