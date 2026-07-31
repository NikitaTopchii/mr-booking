import type { AppDictionary } from '@mr-booking/shared-i18n';
import type { FeatureErrorCatalog } from '@mr-booking/shared-feature-error';

export const roomQueryErrorCatalog = {
  service: {
    messageKey: 'rooms',
    severity: 'error',
    retryable: true,
    telemetryCode: 'schedule.rooms.query.service_failure',
  },
} as const satisfies FeatureErrorCatalog<
  keyof AppDictionary['schedule']['errors']
>;

export type RoomQueryErrorCode = keyof typeof roomQueryErrorCatalog;
