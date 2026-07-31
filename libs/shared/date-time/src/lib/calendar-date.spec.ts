import {
  addCalendarDays,
  formatCalendarDate,
  getCalendarWeekday,
  parseCalendarDate,
} from './calendar-date';

describe('calendar dates', () => {
  it('strictly parses, formats, and advances Gregorian dates', () => {
    const date = parseCalendarDate('2028-12-31');
    expect(date).toEqual({ year: 2028, month: 12, day: 31 });
    if (!date) throw new Error('Expected a parsed calendar date');
    expect(formatCalendarDate(addCalendarDays(date, 1))).toBe('2029-01-01');
    expect(parseCalendarDate('2028-02-30')).toBeUndefined();
    expect(parseCalendarDate('2028-2-03')).toBeUndefined();
  });

  it('reports the Gregorian weekday without embedding a Monday policy', () => {
    expect(getCalendarWeekday({ year: 2026, month: 7, day: 27 })).toBe(1);
  });
});
