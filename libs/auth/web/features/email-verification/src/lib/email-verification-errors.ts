import { EmailVerificationClientError } from '@mr-booking/auth-data-access-web/client';
import type { EmailVerificationErrorCode } from './types/email-verification-feature.types';

export function classifyEmailVerificationError(
  cause: unknown,
): EmailVerificationErrorCode {
  if (!(cause instanceof EmailVerificationClientError)) {
    return 'service';
  }

  switch (cause.code) {
    case 'EMAIL_VERIFICATION_RATE_LIMITED':
      return 'rateLimited';
    case 'EMAIL_VERIFICATION_DELIVERY_FAILED':
      return 'deliveryFailed';
    case 'EMAIL_VERIFICATION_INVALID_OR_EXPIRED':
      return 'invalid';
    case 'UNAUTHENTICATED':
      return 'unauthenticated';
    default:
      return 'service';
  }
}
