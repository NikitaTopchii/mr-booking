export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
  | 'EMAIL_ALREADY_VERIFIED'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFICATION_RATE_LIMITED'
  | 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'EMAIL_VERIFICATION_DELIVERY_FAILED'
  | 'EMAIL_VERIFIED'
  | 'SERVICE_UNAVAILABLE';

export type AuthField = 'name' | 'email' | 'password';

export const authFieldErrorCodes = [
  'NAME_REQUIRED',
  'EMAIL_REQUIRED',
  'EMAIL_INVALID',
  'PASSWORD_REQUIRED',
  'PASSWORD_LENGTH',
  'EMAIL_ALREADY_EXISTS',
] as const;

export type AuthFieldErrorCode = (typeof authFieldErrorCodes)[number];

export class AuthValidationError extends Error {
  public readonly code = 'VALIDATION_ERROR' as const;

  public constructor(
    public readonly fields: Readonly<
      Partial<Record<AuthField, AuthFieldErrorCode>>
    >,
  ) {
    super('VALIDATION_ERROR');
    this.name = 'AuthValidationError';
  }
}

export class EmailAlreadyExistsError extends Error {
  public readonly code = 'EMAIL_ALREADY_EXISTS' as const;

  public constructor() {
    super('EMAIL_ALREADY_EXISTS');
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends Error {
  public readonly code = 'INVALID_CREDENTIALS' as const;

  public constructor() {
    super('INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export class UnauthenticatedError extends Error {
  public readonly code = 'UNAUTHENTICATED' as const;

  public constructor() {
    super('UNAUTHENTICATED');
    this.name = 'UnauthenticatedError';
  }
}

export class EmailNotVerifiedError extends Error {
  public readonly code = 'EMAIL_VERIFICATION_REQUIRED' as const;

  public constructor() {
    super('EMAIL_VERIFICATION_REQUIRED');
    this.name = 'EmailNotVerifiedError';
  }
}

export class EmailAlreadyVerifiedError extends Error {
  public readonly code = 'EMAIL_ALREADY_VERIFIED' as const;

  public constructor() {
    super('EMAIL_ALREADY_VERIFIED');
    this.name = 'EmailAlreadyVerifiedError';
  }
}

export class EmailVerificationRateLimitedError extends Error {
  public readonly code = 'EMAIL_VERIFICATION_RATE_LIMITED' as const;

  public constructor(public readonly retryAfterSeconds: number) {
    super('EMAIL_VERIFICATION_RATE_LIMITED');
    this.name = 'EmailVerificationRateLimitedError';
  }
}

export class EmailVerificationInvalidOrExpiredError extends Error {
  public readonly code = 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED' as const;

  public constructor() {
    super('EMAIL_VERIFICATION_INVALID_OR_EXPIRED');
    this.name = 'EmailVerificationInvalidOrExpiredError';
  }
}

export class EmailVerificationDeliveryFailedError extends Error {
  public readonly code = 'EMAIL_VERIFICATION_DELIVERY_FAILED' as const;

  public constructor() {
    super('EMAIL_VERIFICATION_DELIVERY_FAILED');
    this.name = 'EmailVerificationDeliveryFailedError';
  }
}

export class ServiceUnavailableError extends Error {
  public readonly code = 'SERVICE_UNAVAILABLE' as const;

  public constructor() {
    super('SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}
