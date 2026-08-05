import { createBookingScheduleHref } from './create-booking-schedule-href';

describe('booking schedule links', () => {
  it('uses the browser-local date and normalized schedule week', () => {
    expect(
      createBookingScheduleHref(
        'uk',
        'room/one',
        '2026-08-02T23:30:00.000Z',
        'Europe/Kyiv',
      ),
    ).toBe('/uk/schedule?date=2026-08-03&week=2026-08-03&roomId=room%2Fone');
    expect(
      createBookingScheduleHref(
        'en',
        'room/one',
        '2026-08-02T23:30:00.000Z',
        'America/New_York',
      ),
    ).toBe('/en/schedule?date=2026-08-02&week=2026-07-27&roomId=room%2Fone');
  });
});
