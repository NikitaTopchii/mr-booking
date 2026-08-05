import { calendarDateAt } from './calendar-date-at';

describe('calendarDateAt', () => {
  it('returns the calendar date in the requested timezone', () => {
    expect(
      calendarDateAt(Date.parse('2026-07-30T23:30:00.000Z'), 'Europe/Kyiv'),
    ).toEqual({ year: 2026, month: 7, day: 31 });
  });
});
