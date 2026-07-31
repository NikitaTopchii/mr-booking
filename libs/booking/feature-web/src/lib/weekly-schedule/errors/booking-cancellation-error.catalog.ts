import type { AppDictionary } from '@mr-booking/shared-i18n';
import type { FeatureErrorCatalog } from '@mr-booking/shared-feature-error';

export const bookingCancellationErrorCatalog = {
  notCancellable: {
    messageKey: 'notCancellable',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.cancel.not_cancellable',
  },
  forbidden: {
    messageKey: 'forbidden',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.cancel.forbidden',
  },
  notFound: {
    messageKey: 'notFound',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.cancel.not_found',
  },
  service: {
    messageKey: 'generic',
    severity: 'error',
    retryable: true,
    telemetryCode: 'schedule.booking.cancel.service_failure',
  },
} as const satisfies FeatureErrorCatalog<
  keyof AppDictionary['schedule']['errors']['cancellation']
>;

export type BookingCancellationErrorCode =
  keyof typeof bookingCancellationErrorCatalog;
