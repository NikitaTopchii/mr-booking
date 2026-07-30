import {
  createScheduleBookingHref,
  createScheduleSearchParams,
} from './schedule-navigation';

describe('schedule booking navigation', () => {
  it('uses the browser-local Monday and safely encodes the room', () => {
    expect(
      createScheduleBookingHref(
        'uk',
        'room/one',
        '2026-08-02T23:30:00.000Z',
        'Europe/Kyiv',
      ),
    ).toBe('/uk/schedule?date=2026-08-03&week=2026-08-03&roomId=room%2Fone');
    expect(
      createScheduleBookingHref(
        'en',
        'room/one',
        '2026-08-02T23:30:00.000Z',
        'America/New_York',
      ),
    ).toBe('/en/schedule?date=2026-08-02&week=2026-07-27&roomId=room%2Fone');
  });

  it('preserves unrelated parameters and normalizes date with its week', () => {
    expect(
      createScheduleSearchParams('localeHint=en&roomId=old', {
        roomId: 'room-2',
        date: '2026-08-02',
      }).toString(),
    ).toBe('localeHint=en&roomId=room-2&date=2026-08-02&week=2026-07-27');
  });
});
