import { IntlZonedDateTimeAdapter } from './intl-zoned-date-time-adapter';
import { ZonedDateTimeError } from './zoned-date-time.errors';

describe('IntlZonedDateTimeAdapter', () => {
  it('supports positive and negative UTC offsets', () => {
    const kyiv = new IntlZonedDateTimeAdapter('Europe/Kyiv', 'reject');
    const newYork = new IntlZonedDateTimeAdapter('America/New_York', 'reject');

    expect(
      new Date(
        kyiv.toUtcInstant({
          date: { year: 2026, month: 7, day: 27 },
          hour: 9,
          minute: 0,
        }),
      ).toISOString(),
    ).toBe('2026-07-27T06:00:00.000Z');
    expect(
      new Date(
        newYork.toUtcInstant({
          date: { year: 2026, month: 1, day: 12 },
          hour: 9,
          minute: 0,
        }),
      ).toISOString(),
    ).toBe('2026-01-12T14:00:00.000Z');
  });

  it('rejects nonexistent spring-forward local times', () => {
    const adapter = new IntlZonedDateTimeAdapter('America/New_York', 'reject');
    expect(() =>
      adapter.toUtcInstant({
        date: { year: 2026, month: 3, day: 8 },
        hour: 2,
        minute: 30,
      }),
    ).toThrow(expect.objectContaining({ code: 'NONEXISTENT_LOCAL_DATE_TIME' }));
  });

  it('applies an explicit policy to ambiguous fall-back local times', () => {
    const input = {
      date: { year: 2026, month: 11, day: 1 },
      hour: 1,
      minute: 30,
    } as const;
    const earlier = new IntlZonedDateTimeAdapter('America/New_York', 'earlier');
    const later = new IntlZonedDateTimeAdapter('America/New_York', 'later');
    const rejecting = new IntlZonedDateTimeAdapter(
      'America/New_York',
      'reject',
    );

    expect(new Date(earlier.toUtcInstant(input)).toISOString()).toBe(
      '2026-11-01T05:30:00.000Z',
    );
    expect(new Date(later.toUtcInstant(input)).toISOString()).toBe(
      '2026-11-01T06:30:00.000Z',
    );
    expect(() => rejecting.toUtcInstant(input)).toThrow(
      expect.objectContaining({ code: 'AMBIGUOUS_LOCAL_DATE_TIME' }),
    );
  });

  it('uses typed errors for invalid zones and instants', () => {
    expect(() => new IntlZonedDateTimeAdapter('Not/A_Zone', 'reject')).toThrow(
      ZonedDateTimeError,
    );
    const adapter = new IntlZonedDateTimeAdapter('UTC', 'reject');
    expect(() => adapter.partsAt(Number.NaN)).toThrow(
      expect.objectContaining({ code: 'INVALID_EPOCH_INSTANT' }),
    );
  });
});
