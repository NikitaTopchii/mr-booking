import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UnauthenticatedError } from '@mr-booking/auth-domain';
import {
  BookingCancellationForbiddenError,
  BookingConflictError,
  BookingNotCancellableError,
  BookingNotFoundError,
  BookingOutsideOfficeHoursError,
  BookingSlotAlignmentError,
  BookingStartNotInFutureError,
  BookingTitleRequiredError,
  BookingTitleTooLongError,
  DatabaseBusyError,
  InvalidBookingDurationError,
  InvalidBookingIntervalError,
  RoomNotFoundError,
  ScheduleRangeValidationError,
} from '@mr-booking/booking-domain';
import type { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class BookingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BookingExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'private, no-store');

    if (exception instanceof UnauthenticatedError) {
      this.respond(response, HttpStatus.UNAUTHORIZED, exception.code);
      return;
    }

    if (
      exception instanceof ZodError ||
      exception instanceof BadRequestException ||
      exception instanceof ScheduleRangeValidationError
    ) {
      this.respond(response, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR');
      return;
    }

    if (
      exception instanceof BookingTitleRequiredError ||
      exception instanceof BookingTitleTooLongError ||
      exception instanceof InvalidBookingIntervalError ||
      exception instanceof BookingStartNotInFutureError ||
      exception instanceof InvalidBookingDurationError ||
      exception instanceof BookingSlotAlignmentError ||
      exception instanceof BookingOutsideOfficeHoursError
    ) {
      this.respond(response, HttpStatus.BAD_REQUEST, exception.code);
      return;
    }

    if (
      exception instanceof RoomNotFoundError ||
      exception instanceof BookingNotFoundError
    ) {
      this.respond(response, HttpStatus.NOT_FOUND, exception.code);
      return;
    }

    if (exception instanceof BookingCancellationForbiddenError) {
      this.respond(response, HttpStatus.FORBIDDEN, exception.code);
      return;
    }

    if (
      exception instanceof BookingConflictError ||
      exception instanceof BookingNotCancellableError
    ) {
      this.respond(response, HttpStatus.CONFLICT, exception.code);
      return;
    }

    if (exception instanceof DatabaseBusyError) {
      this.respond(response, HttpStatus.SERVICE_UNAVAILABLE, exception.code);
      return;
    }

    const errorType =
      exception instanceof Error ? exception.constructor.name : 'Unknown';
    this.logger.error(
      JSON.stringify({ event: 'booking.request_failed', errorType }),
    );
    this.respond(
      response,
      HttpStatus.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
    );
  }

  private respond(response: Response, status: number, code: string): void {
    response.status(status).json({ code });
  }
}
