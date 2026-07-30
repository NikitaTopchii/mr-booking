import {
  addCalendarDays,
  createScheduleWeek,
  formatCalendarDate,
  parseCalendarDate,
  startOfLocalWeek,
  zonedDateTimeToEpoch,
} from './schedule-time';

describe('schedule time', () => {
  it('strictly parses calendar dates and adds days across boundaries', () => {
    expect(parseCalendarDate('2026-02-30')).toBeUndefined();
    expect(parseCalendarDate('2026-2-03')).toBeUndefined();
    expect(
      formatCalendarDate(
        addCalendarDays({ year: 2026, month: 12, day: 31 }, 1),
      ),
    ).toBe('2027-01-01');
  });

  it('finds browser-local Monday', () => {
    expect(
      formatCalendarDate(
        startOfLocalWeek(Date.parse('2026-07-30T23:30:00.000Z'), 'Europe/Kyiv'),
      ),
    ).toBe('2026-07-27');
  });

  it('converts Kyiv office time without a fixed UTC offset', () => {
    expect(
      new Date(
        zonedDateTimeToEpoch(
          { year: 2026, month: 1, day: 12 },
          9,
          0,
          'Europe/Kyiv',
        ),
      ).toISOString(),
    ).toBe('2026-01-12T07:00:00.000Z');
    expect(
      new Date(
        zonedDateTimeToEpoch(
          { year: 2026, month: 7, day: 27 },
          9,
          0,
          'Europe/Kyiv',
        ),
      ).toISOString(),
    ).toBe('2026-07-27T06:00:00.000Z');
  });

  it('builds a seven-day absolute range with 30-minute office slots', () => {
    const week = createScheduleWeek('2026-07-27', 'Europe/Lisbon');

    expect(week.visibleDates).toHaveLength(7);
    expect(week.slots).toHaveLength(140);
    expect(week.range).toEqual({
      fromUtc: '2026-07-27T06:00:00.000Z',
      toUtc: '2026-08-02T16:00:00.000Z',
    });
    expect(
      week.slots.every(
        (slot) => slot.endsAtUtc - slot.startsAtUtc === 30 * 60 * 1_000,
      ),
    ).toBe(true);
  });

  it('rejects non-Monday URL week keys', () => {
    expect(() => createScheduleWeek('2026-07-28', 'Europe/Kyiv')).toThrow(
      'INVALID_WEEK',
    );
  });
});
