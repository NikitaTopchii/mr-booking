import { formatBookingDateTimeRange } from './format-booking-date-time-range';

describe('formatBookingDateTimeRange', () => {
  it('keeps a same-day booking on one localized date', () => {
    expect(
      formatBookingDateTimeRange({
        startsAtUtc: '2026-07-30T09:00:00.000Z',
        endsAtUtc: '2026-07-30T10:00:00.000Z',
        locale: 'en-US',
        timeZone: 'UTC',
      }),
    ).toBe('Jul 30, 2026 · 09:00 AM–10:00 AM');
  });

  it('includes both localized dates when a booking crosses midnight', () => {
    expect(
      formatBookingDateTimeRange({
        startsAtUtc: '2026-07-30T23:30:00.000Z',
        endsAtUtc: '2026-07-31T00:30:00.000Z',
        locale: 'en-US',
        timeZone: 'UTC',
      }),
    ).toBe('Jul 30, 2026 · 11:30 PM–Jul 31, 2026 · 12:30 AM');
  });
});
