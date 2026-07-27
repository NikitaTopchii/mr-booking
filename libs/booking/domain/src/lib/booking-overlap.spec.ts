import { bookingIntervalsOverlap } from './booking-overlap';

const roomId = 'room-aquarium';
const day = Date.UTC(2026, 0, 10);
const at = (hour: number, minute = 0) =>
  day + hour * 60 * 60 * 1000 + minute * 60 * 1000;

describe('half-open booking overlap', () => {
  it.each([
    [at(10), at(11), at(11), at(12), false],
    [at(10), at(11), at(9, 30), at(10, 30), true],
    [at(10), at(11), at(10, 30), at(11, 30), true],
    [at(10), at(11), at(10), at(11), true],
    [at(10), at(12), at(10, 30), at(11), true],
    [at(10, 30), at(11), at(10), at(12), true],
  ])(
    'evaluates half-open interval boundaries',
    (firstStart, firstEnd, secondStart, secondEnd, expected) => {
      expect(
        bookingIntervalsOverlap(
          { roomId, startsAtUtc: firstStart, endsAtUtc: firstEnd },
          {
            roomId,
            startsAtUtc: secondStart,
            endsAtUtc: secondEnd,
          },
        ),
      ).toBe(expected);
    },
  );

  it('allows the same time in different rooms', () => {
    expect(
      bookingIntervalsOverlap(
        { roomId, startsAtUtc: at(10), endsAtUtc: at(11) },
        {
          roomId: 'room-mars',
          startsAtUtc: at(10),
          endsAtUtc: at(11),
        },
      ),
    ).toBe(false);
  });

  it('does not overlap the same clock time on neighbouring days', () => {
    const nextDay = day + 24 * 60 * 60 * 1000;

    expect(
      bookingIntervalsOverlap(
        { roomId, startsAtUtc: at(10), endsAtUtc: at(11) },
        {
          roomId,
          startsAtUtc: nextDay + 10 * 60 * 60 * 1000,
          endsAtUtc: nextDay + 11 * 60 * 60 * 1000,
        },
      ),
    ).toBe(false);
  });
});
