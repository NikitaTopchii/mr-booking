import type { FeatureErrorCatalog } from '@mr-booking/shared-error-handling';

export const emailVerificationErrorCatalog = {
  rateLimited: {
    messageKey: 'rateLimited',
    severity: 'warning',
    retryable: true,
    telemetryCode: 'auth.email_verification.rate_limited',
  },
  deliveryFailed: {
    messageKey: 'deliveryFailed',
    severity: 'error',
    retryable: true,
    telemetryCode: 'auth.email_verification.delivery_failed',
  },
  unauthenticated: {
    messageKey: 'unauthenticated',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'auth.email_verification.unauthenticated',
  },
  invalid: {
    messageKey: 'invalid',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'auth.email_verification.invalid',
  },
  service: {
    messageKey: 'service',
    severity: 'error',
    retryable: true,
    telemetryCode: 'auth.email_verification.service_failure',
  },
} as const satisfies FeatureErrorCatalog<string>;
