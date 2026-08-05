import { BookingClientError } from '@mr-booking/booking-data-access-web';
import { classifyBookingCancellationError } from './booking-cancellation-error.classifier';
import { classifyBookingCreationError } from './booking-creation-error.classifier';
import { classifyRoomQueryError } from './room-query-error.classifier';
import { classifyScheduleQueryError } from './schedule-query-error.classifier';

describe('booking creation error classifier', () => {
  it.each([
    ['BOOKING_CONFLICT', 'conflict'],
    ['BOOKING_START_NOT_IN_FUTURE', 'startNotInFuture'],
    ['BOOKING_OUTSIDE_OFFICE_HOURS', 'outsideOfficeHours'],
    ['BOOKING_INVALID_DURATION', 'invalidDuration'],
    ['BOOKING_SLOT_ALIGNMENT', 'invalidSlotAlignment'],
    ['BOOKING_TITLE_REQUIRED', 'invalidTitle'],
    ['BOOKING_TITLE_TOO_LONG', 'invalidTitle'],
    ['BOOKING_INVALID_INTERVAL', 'validation'],
    ['VALIDATION_ERROR', 'validation'],
    ['ROOM_NOT_FOUND', 'roomNotFound'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(
      classifyBookingCreationError(new BookingClientError(code, undefined)),
    ).toBe(expected);
  });

  it.each([
    new BookingClientError('UNKNOWN_CODE', undefined),
    new Error('unexpected'),
    null,
    'unexpected',
  ])('maps unknown causes to service: %p', (cause) => {
    expect(classifyBookingCreationError(cause)).toBe('service');
  });
});

describe('booking cancellation error classifier', () => {
  it.each([
    ['BOOKING_NOT_CANCELLABLE', 'notCancellable'],
    ['BOOKING_CANCELLATION_FORBIDDEN', 'forbidden'],
    ['BOOKING_NOT_FOUND', 'notFound'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(
      classifyBookingCancellationError(new BookingClientError(code, undefined)),
    ).toBe(expected);
  });

  it.each([
    new BookingClientError('BOOKING_CONFLICT', undefined),
    new BookingClientError('BOOKING_OUTSIDE_OFFICE_HOURS', undefined),
    new BookingClientError('UNKNOWN_CODE', undefined),
    new Error('unexpected'),
    undefined,
  ])('does not expose creation errors: %p', (cause) => {
    expect(classifyBookingCancellationError(cause)).toBe('service');
  });
});

describe('schedule query classifiers', () => {
  it('maps a stale room to roomNotFound', () => {
    expect(
      classifyScheduleQueryError(
        new BookingClientError('ROOM_NOT_FOUND', undefined),
      ),
    ).toBe('roomNotFound');
  });

  it('maps unknown schedule and room failures to service', () => {
    expect(classifyScheduleQueryError(new Error('unexpected'))).toBe('service');
    expect(
      classifyRoomQueryError(
        new BookingClientError('ROOM_NOT_FOUND', undefined),
      ),
    ).toBe('service');
  });
});
