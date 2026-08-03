import type {
  AuthErrorCode,
  AuthFieldErrorCode,
  SafeUser,
} from '@mr-booking/auth-domain';
import type { z } from 'zod';
import type {
  emailVerificationDeliverySchema,
  emailVerificationRequestResponseSchema,
  emailVerificationVerifyResponseSchema,
} from '../email-verification-client.schemas';

export interface AuthenticationResponse {
  readonly user: SafeUser;
  readonly emailVerification?:
    z.infer<typeof emailVerificationDeliverySchema> | undefined;
}

export type AuthClientErrorCode = AuthErrorCode | 'NETWORK_ERROR';

export interface AuthFieldErrorPayload {
  readonly name?: AuthFieldErrorCode | undefined;
  readonly email?: AuthFieldErrorCode | undefined;
  readonly password?: AuthFieldErrorCode | undefined;
}

export type EmailVerificationRequestResponse = z.infer<
  typeof emailVerificationRequestResponseSchema
>;

export type EmailVerificationVerifyResponse = z.infer<
  typeof emailVerificationVerifyResponseSchema
>;

export type EmailVerificationClientErrorCode =
  | 'EMAIL_VERIFICATION_RATE_LIMITED'
  | 'EMAIL_VERIFICATION_DELIVERY_FAILED'
  | 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED'
  | 'EMAIL_ALREADY_VERIFIED'
  | 'UNAUTHENTICATED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | string;
