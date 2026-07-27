export type AuthErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHENTICATED'
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

export class ServiceUnavailableError extends Error {
  public readonly code = 'SERVICE_UNAVAILABLE' as const;

  public constructor() {
    super('SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}
