import type { ArgumentsHost } from '@nestjs/common';
import {
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  AuthValidationError,
  EmailVerificationDeliveryFailedError,
  EmailVerificationInvalidOrExpiredError,
  EmailVerificationRateLimitedError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  ServiceUnavailableError,
  UnauthenticatedError,
} from '@mr-booking/auth-domain';
import type { Response } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'private, no-store');

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (exception instanceof AuthValidationError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: exception.code,
        details: { fields: exception.fields },
      });
      return;
    }

    if (exception instanceof EmailAlreadyExistsError) {
      response.status(HttpStatus.CONFLICT).json({
        code: exception.code,
        details: {
          fields: { email: 'EMAIL_ALREADY_EXISTS' },
        },
      });
      return;
    }

    if (
      exception instanceof InvalidCredentialsError ||
      exception instanceof UnauthenticatedError
    ) {
      response.status(HttpStatus.UNAUTHORIZED).json({
        code: exception.code,
      });
      return;
    }

    if (exception instanceof EmailVerificationRateLimitedError) {
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        code: exception.code,
        details: { retryAfterSeconds: exception.retryAfterSeconds },
      });
      return;
    }

    if (exception instanceof EmailVerificationInvalidOrExpiredError) {
      response.status(HttpStatus.BAD_REQUEST).json({ code: exception.code });
      return;
    }

    if (exception instanceof EmailVerificationDeliveryFailedError) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        code: exception.code,
      });
      return;
    }

    const unavailable =
      exception instanceof ServiceUnavailableError
        ? exception
        : new ServiceUnavailableError();
    const errorType =
      exception instanceof Error ? exception.constructor.name : 'Unknown';

    this.logger.error(
      JSON.stringify({ event: 'auth.request_failed', errorType }),
    );
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      code: unavailable.code,
    });
  }
}
