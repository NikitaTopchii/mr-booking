import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  AuthValidationError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  ServiceUnavailableError,
  UnauthenticatedError,
} from '@mr-booking/auth-domain';
import type { Response } from 'express';

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader('Cache-Control', 'private, no-store');

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
