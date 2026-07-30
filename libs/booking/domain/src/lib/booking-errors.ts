export type BookingErrorCode =
  | 'BOOKING_TITLE_REQUIRED'
  | 'BOOKING_TITLE_TOO_LONG'
  | 'BOOKING_START_NOT_IN_FUTURE'
  | 'BOOKING_INVALID_INTERVAL'
  | 'BOOKING_INVALID_DURATION'
  | 'BOOKING_SLOT_ALIGNMENT'
  | 'BOOKING_OUTSIDE_OFFICE_HOURS'
  | 'ROOM_NOT_FOUND'
  | 'BOOKING_CONFLICT'
  | 'BOOKING_NOT_FOUND'
  | 'BOOKING_CANCELLATION_FORBIDDEN'
  | 'BOOKING_NOT_CANCELLABLE'
  | 'DATABASE_BUSY';

export class ScheduleRangeValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR' as const;

  public constructor() {
    super('VALIDATION_ERROR');
    this.name = 'ScheduleRangeValidationError';
  }
}

abstract class BookingError extends Error {
  protected constructor(public readonly code: BookingErrorCode) {
    super(code);
    this.name = new.target.name;
  }
}

export class BookingTitleRequiredError extends BookingError {
  public constructor() {
    super('BOOKING_TITLE_REQUIRED');
  }
}

export class BookingTitleTooLongError extends BookingError {
  public constructor() {
    super('BOOKING_TITLE_TOO_LONG');
  }
}

export class BookingStartNotInFutureError extends BookingError {
  public constructor() {
    super('BOOKING_START_NOT_IN_FUTURE');
  }
}

export class InvalidBookingIntervalError extends BookingError {
  public constructor() {
    super('BOOKING_INVALID_INTERVAL');
  }
}

export class InvalidBookingDurationError extends BookingError {
  public constructor() {
    super('BOOKING_INVALID_DURATION');
  }
}

export class BookingSlotAlignmentError extends BookingError {
  public constructor() {
    super('BOOKING_SLOT_ALIGNMENT');
  }
}

export class BookingOutsideOfficeHoursError extends BookingError {
  public constructor() {
    super('BOOKING_OUTSIDE_OFFICE_HOURS');
  }
}

export class RoomNotFoundError extends BookingError {
  public constructor() {
    super('ROOM_NOT_FOUND');
  }
}

export class BookingConflictError extends BookingError {
  public constructor() {
    super('BOOKING_CONFLICT');
  }
}

export class BookingNotFoundError extends BookingError {
  public constructor() {
    super('BOOKING_NOT_FOUND');
  }
}

export class BookingCancellationForbiddenError extends BookingError {
  public constructor() {
    super('BOOKING_CANCELLATION_FORBIDDEN');
  }
}

export class BookingNotCancellableError extends BookingError {
  public constructor() {
    super('BOOKING_NOT_CANCELLABLE');
  }
}

export class DatabaseBusyError extends BookingError {
  public constructor() {
    super('DATABASE_BUSY');
  }
}
