import {
  InvalidOfficeDateTimeError,
  getOfficeCalendarDate,
  getOfficeDateTimeParts,
  officeDateTimeToUtcInstant,
} from './office-time';

describe('office time', () => {
  it('reads the office-local date when it differs from UTC', () => {
    expect(
      getOfficeCalendarDate(Date.parse('2026-07-30T21:30:00.000Z')),
    ).toEqual({ year: 2026, month: 7, day: 31 });
  });

  it('converts winter and summer office times with the correct offsets', () => {
    expect(
      officeDateTimeToUtcInstant({
        date: { year: 2030, month: 1, day: 7 },
        hour: 12,
        minute: 0,
      }),
    ).toBe(Date.parse('2030-01-07T10:00:00.000Z'));
    expect(
      officeDateTimeToUtcInstant({
        date: { year: 2030, month: 7, day: 1 },
        hour: 12,
        minute: 0,
      }),
    ).toBe(Date.parse('2030-07-01T09:00:00.000Z'));
  });

  it('round-trips valid office time across a DST transition week', () => {
    const instant = officeDateTimeToUtcInstant({
      date: { year: 2030, month: 3, day: 31 },
      hour: 9,
      minute: 30,
    });

    expect(getOfficeDateTimeParts(instant)).toMatchObject({
      year: 2030,
      month: 3,
      day: 31,
      hour: 9,
      minute: 30,
    });
  });

  it('rejects impossible local date-time fields through the domain error', () => {
    expect(() =>
      officeDateTimeToUtcInstant({
        date: { year: 2030, month: 2, day: 30 },
        hour: 9,
        minute: 0,
      }),
    ).toThrow(InvalidOfficeDateTimeError);
  });
});
