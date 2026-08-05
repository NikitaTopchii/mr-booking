import type { AppDictionary } from '@mr-booking/shared-i18n';
import type { FeatureErrorCatalog } from '@mr-booking/shared-feature-error';

export const bookingCreationErrorCatalog = {
  conflict: {
    messageKey: 'conflict',
    severity: 'warning',
    retryable: true,
    telemetryCode: 'schedule.booking.create.conflict',
  },
  startNotInFuture: {
    messageKey: 'startNotInFuture',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.start_not_in_future',
  },
  outsideOfficeHours: {
    messageKey: 'outsideHours',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.outside_office_hours',
  },
  invalidDuration: {
    messageKey: 'invalidDuration',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.invalid_duration',
  },
  invalidSlotAlignment: {
    messageKey: 'invalidSlotAlignment',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.invalid_slot_alignment',
  },
  invalidTitle: {
    messageKey: 'invalidTitle',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.invalid_title',
  },
  validation: {
    messageKey: 'validation',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.validation',
  },
  roomNotFound: {
    messageKey: 'roomNotFound',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.room_not_found',
  },
  emailVerificationRequired: {
    messageKey: 'emailVerificationRequired',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.booking.create.email_verification_required',
  },
  service: {
    messageKey: 'generic',
    severity: 'error',
    retryable: true,
    telemetryCode: 'schedule.booking.create.service_failure',
  },
} as const satisfies FeatureErrorCatalog<
  keyof AppDictionary['schedule']['errors']['creation']
>;

export type BookingCreationErrorCode = keyof typeof bookingCreationErrorCatalog;
