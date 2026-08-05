export * from './lib/auth-client';
export type {
  AuthenticationResponse,
  AuthClientErrorCode,
} from './lib/types/auth-client.types';
export {
  EmailVerificationClientError,
  authKeys,
  fetchCurrentUser,
  requestEmailVerification,
  verifyEmail,
} from './lib/email-verification-client';
export {
  emailVerificationRequestResponseSchema,
  emailVerificationVerifyResponseSchema,
} from './lib/email-verification-client.schemas';
