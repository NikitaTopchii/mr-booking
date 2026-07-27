import {
  BOOKING_SLOT_MILLISECONDS,
  validateBookingInterval,
} from './booking-interval';
import { generateBookingSlotStarts } from './booking-slots';

const nowUtc = Date.UTC(2026, 0, 1);
const startsAtUtc = Date.UTC(2026, 0, 10, 8);

describe('booking slot generation', () => {
  it.each([
    [1, 30],
    [2, 60],
    [3, 90],
    [8, 240],
  ])('generates %i ordered slots for %i minutes', (count, minutes) => {
    const interval = validateBookingInterval(
      startsAtUtc,
      startsAtUtc + minutes * 60 * 1000,
      nowUtc,
    );

    expect(generateBookingSlotStarts(interval)).toEqual(
      Array.from(
        { length: count },
        (_, index) => startsAtUtc + index * BOOKING_SLOT_MILLISECONDS,
      ),
    );
  });

  it('does not include the half-open end boundary', () => {
    const endsAtUtc = startsAtUtc + 3 * BOOKING_SLOT_MILLISECONDS;
    const slots = generateBookingSlotStarts(
      validateBookingInterval(startsAtUtc, endsAtUtc, nowUtc),
    );

    expect(slots).not.toContain(endsAtUtc);
    expect(slots.at(-1)).toBe(endsAtUtc - BOOKING_SLOT_MILLISECONDS);
  });
});
