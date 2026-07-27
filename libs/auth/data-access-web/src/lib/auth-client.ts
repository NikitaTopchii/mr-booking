import {
  authFieldErrorCodes,
  type AuthErrorCode,
  type AuthField,
  type AuthFieldErrorCode,
  type LoginInput,
  type RegistrationInput,
  type SafeUser,
} from '@mr-booking/auth-domain';
import { z } from 'zod';

const authFieldErrorCodeSchema = z.enum(authFieldErrorCodes);
const authErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'EMAIL_ALREADY_EXISTS',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'SERVICE_UNAVAILABLE',
]);
const safeUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});
const authenticationResponseSchema = z.object({
  user: safeUserSchema,
});
const fieldErrorsSchema = z
  .object({
    name: authFieldErrorCodeSchema.optional(),
    email: authFieldErrorCodeSchema.optional(),
    password: authFieldErrorCodeSchema.optional(),
  })
  .strict();
const apiErrorSchema = z
  .object({
    code: authErrorCodeSchema,
    details: z
      .object({
        fields: fieldErrorsSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export interface AuthenticationResponse {
  readonly user: SafeUser;
}

export type AuthClientErrorCode = AuthErrorCode | 'NETWORK_ERROR';

export class AuthClientError extends Error {
  public constructor(
    public readonly code: AuthClientErrorCode,
    public readonly status: number | undefined,
    public readonly fields: Readonly<
      Partial<Record<AuthField, AuthFieldErrorCode>>
    > = {},
  ) {
    super(code);
    this.name = 'AuthClientError';
  }
}

export async function registerUser(
  input: RegistrationInput,
): Promise<AuthenticationResponse> {
  return requestAuthentication('/api/auth/register', input);
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthenticationResponse> {
  return requestAuthentication('/api/auth/login', input);
}

export async function getCurrentUser(): Promise<AuthenticationResponse> {
  return requestJson('/api/auth/me', { method: 'GET' });
}

export async function logoutSession(): Promise<void> {
  const response = await request('/api/auth/logout', { method: 'POST' });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }
}

async function requestAuthentication(
  endpoint: string,
  input: LoginInput | RegistrationInput,
): Promise<AuthenticationResponse> {
  return requestJson(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

async function requestJson(
  endpoint: string,
  init: RequestInit,
): Promise<AuthenticationResponse> {
  const response = await request(endpoint, init);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  try {
    const parsed = authenticationResponseSchema.safeParse(
      await response.json(),
    );

    if (!parsed.success) {
      throw new AuthClientError('SERVICE_UNAVAILABLE', response.status);
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof AuthClientError) {
      throw error;
    }

    throw new AuthClientError('SERVICE_UNAVAILABLE', response.status);
  }
}

async function request(endpoint: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(endpoint, {
      ...init,
      credentials: 'same-origin',
    });
  } catch {
    throw new AuthClientError('NETWORK_ERROR', undefined);
  }
}

async function parseErrorResponse(
  response: Response,
): Promise<AuthClientError> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json());

    if (!parsed.success) {
      return new AuthClientError('SERVICE_UNAVAILABLE', response.status);
    }

    return new AuthClientError(
      parsed.data.code,
      response.status,
      compactFieldErrors(parsed.data.details?.fields),
    );
  } catch {
    return new AuthClientError('SERVICE_UNAVAILABLE', response.status);
  }
}

function compactFieldErrors(
  fields:
    | {
        readonly name?: AuthFieldErrorCode | undefined;
        readonly email?: AuthFieldErrorCode | undefined;
        readonly password?: AuthFieldErrorCode | undefined;
      }
    | undefined,
): Partial<Record<AuthField, AuthFieldErrorCode>> {
  const compacted: Partial<Record<AuthField, AuthFieldErrorCode>> = {};

  for (const field of ['name', 'email', 'password'] as const) {
    const code = fields?.[field];

    if (code) {
      compacted[field] = code;
    }
  }

  return compacted;
}
