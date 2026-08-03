import type { z } from 'zod';
import { getCurrentUser } from './auth-client';
import {
  emailVerificationApiErrorSchema,
  emailVerificationRequestResponseSchema,
  emailVerificationVerifyResponseSchema,
} from './email-verification-client.schemas';
import type {
  EmailVerificationClientErrorCode,
  EmailVerificationRequestResponse,
  EmailVerificationVerifyResponse,
} from './types/auth-client.types';

export class EmailVerificationClientError extends Error {
  public constructor(
    public readonly code: EmailVerificationClientErrorCode,
    public readonly status: number | undefined,
    public readonly retryAfterSeconds?: number,
  ) {
    super(code);
    this.name = 'EmailVerificationClientError';
  }
}

export const authKeys = {
  currentUser: () => ['auth', 'current-user'] as const,
};

export async function requestEmailVerification(
  locale: 'uk' | 'en',
): Promise<EmailVerificationRequestResponse> {
  const response = await request('/api/auth/email-verification/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ locale }),
  });
  return parseResponse(response, emailVerificationRequestResponseSchema);
}

export async function verifyEmail(
  token: string,
): Promise<EmailVerificationVerifyResponse> {
  const response = await request('/api/auth/email-verification/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return parseResponse(response, emailVerificationVerifyResponseSchema);
}

export async function fetchCurrentUser() {
  return getCurrentUser();
}

async function request(endpoint: string, init: RequestInit): Promise<Response> {
  try {
    const response = await fetch(endpoint, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    return response;
  } catch (error) {
    if (error instanceof EmailVerificationClientError) {
      throw error;
    }

    throw new EmailVerificationClientError('NETWORK_ERROR', undefined);
  }
}

async function parseResponse<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  try {
    const parsed = schema.safeParse(await response.json());
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // Normalize malformed server output below.
  }

  throw new EmailVerificationClientError('INVALID_RESPONSE', response.status);
}

async function parseError(
  response: Response,
): Promise<EmailVerificationClientError> {
  try {
    const parsed = emailVerificationApiErrorSchema.safeParse(
      await response.json(),
    );
    if (parsed.success) {
      return new EmailVerificationClientError(
        parsed.data.code,
        response.status,
        parsed.data.details?.retryAfterSeconds,
      );
    }
  } catch {
    // Normalize malformed server output below.
  }

  return new EmailVerificationClientError('INVALID_RESPONSE', response.status);
}
