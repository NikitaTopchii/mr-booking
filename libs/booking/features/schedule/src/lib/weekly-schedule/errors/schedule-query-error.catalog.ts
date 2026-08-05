import type { AppDictionary } from '@mr-booking/shared-i18n';
import type { FeatureErrorCatalog } from '@mr-booking/shared-feature-error';

export const scheduleQueryErrorCatalog = {
  roomNotFound: {
    messageKey: 'roomNotFound',
    severity: 'warning',
    retryable: false,
    telemetryCode: 'schedule.query.room_not_found',
  },
  service: {
    messageKey: 'schedule',
    severity: 'error',
    retryable: true,
    telemetryCode: 'schedule.query.service_failure',
  },
} as const satisfies FeatureErrorCatalog<
  keyof AppDictionary['schedule']['errors']
>;

export type ScheduleQueryErrorCode = keyof typeof scheduleQueryErrorCatalog;
