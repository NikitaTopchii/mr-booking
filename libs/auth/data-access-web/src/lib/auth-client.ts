import {
  authFieldErrorCodes,
  type AuthField,
  type AuthFieldErrorCode,
  type LoginInput,
  type RegistrationInput,
} from '@mr-booking/auth-domain';
import { z } from 'zod';
import type {
  AuthenticationResponse,
  AuthClientErrorCode,
  AuthFieldErrorPayload,
} from './types/auth-client.types';

const authFieldErrorCodeSchema = z.enum(authFieldErrorCodes);
const safeUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
  })
  .strict();
const emailVerificationDeliverySchema = z
  .object({
    status: z.enum(['sent', 'delivery-failed', 'already-verified']),
    code: z.enum([
      'EMAIL_VERIFICATION_SENT',
      'EMAIL_VERIFICATION_DELIVERY_FAILED',
      'EMAIL_ALREADY_VERIFIED',
    ]),
    expiresAtUtc: z.iso.datetime({ offset: true }).optional(),
    retryAfterSeconds: z.number().int().positive().optional(),
    developmentVerificationUrl: z.string().url().optional(),
  })
  .strict();
const authenticationResponseSchema = z
  .object({
    user: safeUserSchema,
    emailVerification: emailVerificationDeliverySchema.optional(),
  })
  .strict();
const fieldErrorsSchema = z
  .object({
    name: authFieldErrorCodeSchema.optional(),
    email: authFieldErrorCodeSchema.optional(),
    password: authFieldErrorCodeSchema.optional(),
  })
  .strict();
const validationErrorSchema = z
  .object({
    code: z.literal('VALIDATION_ERROR'),
    details: z
      .object({
        fields: fieldErrorsSchema.refine(
          (fields) => Object.keys(fields).length > 0,
        ),
      })
      .strict(),
  })
  .strict();
const duplicateEmailErrorSchema = z
  .object({
    code: z.literal('EMAIL_ALREADY_EXISTS'),
    details: z
      .object({
        fields: z
          .object({
            email: z.literal('EMAIL_ALREADY_EXISTS'),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
const formErrorSchema = z
  .object({
    code: z.enum([
      'INVALID_CREDENTIALS',
      'UNAUTHENTICATED',
      'EMAIL_VERIFICATION_RATE_LIMITED',
      'EMAIL_VERIFICATION_DELIVERY_FAILED',
      'SERVICE_UNAVAILABLE',
    ]),
  })
  .strict();
const apiErrorSchema = z.union([
  validationErrorSchema,
  duplicateEmailErrorSchema,
  formErrorSchema,
]);

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
  locale: 'uk' | 'en' = 'uk',
): Promise<AuthenticationResponse> {
  return requestAuthentication('/api/auth/register', {
    ...input,
    locale,
  });
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
  input:
    | LoginInput
    | RegistrationInput
    | (RegistrationInput & { readonly locale: 'uk' | 'en' }),
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
      compactFieldErrors(
        'details' in parsed.data ? parsed.data.details.fields : undefined,
      ),
    );
  } catch {
    return new AuthClientError('SERVICE_UNAVAILABLE', response.status);
  }
}

function compactFieldErrors(
  fields: AuthFieldErrorPayload | undefined,
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
