import type {
  OfficeCalendarDate,
  OfficeDateTimeInput,
} from '@mr-booking/booking-domain';

export interface DemoBookingDefinition {
  readonly id: string;
  readonly roomId: string;
  readonly authorUserId: string;
  readonly title: string;
  readonly dayOffset: number;
  readonly startHour: number;
  readonly startMinute: number;
  readonly durationMinutes: number;
}

export interface DemoBookingSeedBookingRecord {
  readonly id: string;
  readonly roomId: string;
  readonly authorUserId: string;
  readonly title: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
  readonly createdAtUtc: number;
  readonly cancelledAtUtc: null;
}

export interface DemoBookingSeedSlotRecord {
  readonly bookingId: string;
  readonly roomId: string;
  readonly slotStartsAtUtc: number;
}

export interface DemoBookingSeedResult {
  readonly weekStart: string;
  readonly bookingCount: number;
  readonly slotCount: number;
}

export interface DemoBookingSeedPlan {
  readonly bookings: readonly DemoBookingSeedBookingRecord[];
  readonly bookingSlots: readonly DemoBookingSeedSlotRecord[];
  readonly summary: DemoBookingSeedResult;
}

export interface CreateDemoBookingSeedPlanInput {
  readonly definitions: readonly DemoBookingDefinition[];
  readonly weekStart: OfficeCalendarDate;
  readonly validationNowUtc: number;
  readonly toUtcInstant: DemoBookingDateTimeConverter;
}

export type DemoBookingDateTimeConverter = (
  input: OfficeDateTimeInput,
) => number;

export type DemoBookingSeedConfigurationErrorCode =
  'DEMO_SEED_INVALID_WEEK_START' | 'DEMO_SEED_WEEK_NOT_FUTURE';
