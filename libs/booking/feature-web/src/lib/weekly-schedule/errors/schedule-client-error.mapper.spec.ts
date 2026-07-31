import { BookingClientError } from '@mr-booking/booking-data-access-web';
import { mapScheduleClientError } from './schedule-client-error.mapper';

describe('mapScheduleClientError', () => {
  it.each([
    ['BOOKING_CONFLICT', 'conflict'],
    ['BOOKING_START_NOT_IN_FUTURE', 'past'],
    ['BOOKING_NOT_CANCELLABLE', 'past'],
    ['BOOKING_OUTSIDE_OFFICE_HOURS', 'outsideOfficeHours'],
    ['BOOKING_INVALID_DURATION', 'invalidDuration'],
    ['BOOKING_SLOT_ALIGNMENT', 'invalidDuration'],
    ['BOOKING_TITLE_REQUIRED', 'validation'],
    ['BOOKING_TITLE_TOO_LONG', 'validation'],
    ['BOOKING_INVALID_INTERVAL', 'validation'],
    ['VALIDATION_ERROR', 'validation'],
    ['BOOKING_CANCELLATION_FORBIDDEN', 'forbidden'],
    ['BOOKING_NOT_FOUND', 'notFound'],
    ['ROOM_NOT_FOUND', 'notFound'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(mapScheduleClientError(new BookingClientError(code))).toBe(expected);
  });

  it('keeps unknown and non-transport errors in the service category', () => {
    expect(mapScheduleClientError(new Error('network'))).toBe('service');
    expect(mapScheduleClientError({ code: 'BOOKING_CONFLICT' })).toBe(
      'service',
    );
    expect(mapScheduleClientError(new BookingClientError('UNKNOWN'))).toBe(
      'service',
    );
  });
});
