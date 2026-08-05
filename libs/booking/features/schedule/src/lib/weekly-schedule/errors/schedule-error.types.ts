import type {
  FeatureError,
  FeatureErrorClock,
  FeatureErrorReporter,
} from '@mr-booking/shared-feature-error';
import type { SchedulePresentation } from '../types/schedule.types';
import type { BookingCreationErrorCode } from './booking-creation-error.catalog';
import type { bookingCreationErrorCatalog } from './booking-creation-error.catalog';
import type { BookingCancellationErrorCode } from './booking-cancellation-error.catalog';
import type { bookingCancellationErrorCatalog } from './booking-cancellation-error.catalog';
import type { RoomQueryErrorCode } from './room-query-error.catalog';
import type { roomQueryErrorCatalog } from './room-query-error.catalog';
import type { ScheduleQueryErrorCode } from './schedule-query-error.catalog';
import type { scheduleQueryErrorCatalog } from './schedule-query-error.catalog';

export interface ScheduleErrorDependencies {
  readonly clock?: FeatureErrorClock;
  readonly reporter?: FeatureErrorReporter;
}

export interface RoomQueryErrorContext {
  readonly operationAttempt: number;
  readonly status?: number;
}

export interface ScheduleQueryErrorContext {
  readonly roomId: string;
  readonly operationAttempt: number;
  readonly status?: number;
}

export interface BookingCreationErrorContext {
  readonly roomId: string;
  readonly startsAtUtc: string;
  readonly endsAtUtc: string;
  readonly presentation: SchedulePresentation;
  readonly operationAttempt: number;
  readonly status?: number;
}

export interface BookingCancellationErrorContext {
  readonly bookingId: string;
  readonly roomId: string;
  readonly operationAttempt: number;
  readonly status?: number;
}

export type RoomQueryFeatureError = FeatureError<
  RoomQueryErrorCode,
  (typeof roomQueryErrorCatalog)[RoomQueryErrorCode]['messageKey'],
  'weeklySchedule',
  'loadRooms',
  RoomQueryErrorContext
>;

export type ScheduleQueryFeatureError = FeatureError<
  ScheduleQueryErrorCode,
  (typeof scheduleQueryErrorCatalog)[ScheduleQueryErrorCode]['messageKey'],
  'weeklySchedule',
  'loadSchedule',
  ScheduleQueryErrorContext
>;

export type BookingCreationFeatureError = FeatureError<
  BookingCreationErrorCode,
  (typeof bookingCreationErrorCatalog)[BookingCreationErrorCode]['messageKey'],
  'weeklySchedule',
  'createBooking',
  BookingCreationErrorContext
>;

export type BookingCancellationFeatureError = FeatureError<
  BookingCancellationErrorCode,
  (typeof bookingCancellationErrorCatalog)[BookingCancellationErrorCode]['messageKey'],
  'weeklySchedule',
  'cancelBooking',
  BookingCancellationErrorContext
>;
