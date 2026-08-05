import {
  selectedDateFromUrl,
  startOfLocalWeek,
} from './schedule-calendar-policy';
import { createPresentationRange, createScheduleWeek } from './schedule-range';
import {
  currentTimePosition,
  overlapsAbsoluteRange,
} from './schedule-indicators';
import { zonedDateTimeToEpoch } from './schedule-zoned-time';
import {
  addCalendarDays,
  formatCalendarDate,
  parseCalendarDate,
} from '@mr-booking/shared-date-time';

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
      fromUtc: '2026-07-26T23:00:00.000Z',
      toUtc: '2026-08-02T23:00:00.000Z',
    });
    expect(
      week.slots.every(
        (slot) => slot.endsAtUtc - slot.startsAtUtc === 30 * 60 * 1_000,
      ),
    ).toBe(true);
  });

  it('normalizes selected date and legacy week URL state', () => {
    const now = Date.parse('2026-07-30T12:00:00.000Z');
    expect(
      formatCalendarDate(
        selectedDateFromUrl('2026-08-02', '2020-01-06', now, 'Europe/Lisbon'),
      ),
    ).toBe('2026-08-02');
    expect(
      formatCalendarDate(
        selectedDateFromUrl(null, '2026-07-27', now, 'Europe/Lisbon'),
      ),
    ).toBe('2026-07-30');
    expect(
      formatCalendarDate(
        selectedDateFromUrl(null, '2026-08-03', now, 'Europe/Lisbon'),
      ),
    ).toBe('2026-08-03');
    expect(
      formatCalendarDate(
        selectedDateFromUrl('invalid', 'invalid', now, 'Europe/Lisbon'),
      ),
    ).toBe('2026-07-30');
  });

  it('creates DST-safe one, three and seven day half-open ranges', () => {
    const selected = { year: 2026, month: 3, day: 28 };
    expect(
      createPresentationRange(selected, 'compact', 'Europe/Lisbon').range,
    ).toEqual({
      fromUtc: '2026-03-28T00:00:00.000Z',
      toUtc: '2026-03-29T00:00:00.000Z',
    });
    expect(
      createPresentationRange(selected, 'medium', 'Europe/Lisbon').range,
    ).toEqual({
      fromUtc: '2026-03-28T00:00:00.000Z',
      toUtc: '2026-03-30T23:00:00.000Z',
    });
    expect(
      createPresentationRange(selected, 'expanded', 'Europe/Lisbon')
        .visibleDates,
    ).toHaveLength(7);
  });

  it('includes bookings crossing a selected-day range boundary', () => {
    const range = createPresentationRange(
      { year: 2026, month: 7, day: 30 },
      'compact',
      'Europe/Lisbon',
    ).range;
    expect(
      overlapsAbsoluteRange(
        '2026-07-29T22:30:00.000Z',
        '2026-07-29T23:30:00.000Z',
        range,
      ),
    ).toBe(true);
    expect(
      overlapsAbsoluteRange(
        '2026-07-29T22:00:00.000Z',
        '2026-07-29T23:00:00.000Z',
        range,
      ),
    ).toBe(false);
  });

  it('positions current time only inside the rendered office interval', () => {
    const range = createPresentationRange(
      { year: 2026, month: 7, day: 30 },
      'compact',
      'Europe/Lisbon',
    );
    const first = range.slots[0];
    const last = range.slots.at(-1);
    if (!first || !last) throw new Error('Expected visible slots');
    expect(currentTimePosition(first.startsAtUtc, first, last)).toBe(0);
    expect(
      currentTimePosition(first.startsAtUtc + 45 * 60 * 1_000, first, last),
    ).toBe(1.5);
    expect(currentTimePosition(last.endsAtUtc, first, last)).toBeUndefined();
  });

  it('rejects non-Monday URL week keys', () => {
    expect(() => createScheduleWeek('2026-07-28', 'Europe/Kyiv')).toThrow(
      'INVALID_WEEK',
    );
  });
});
