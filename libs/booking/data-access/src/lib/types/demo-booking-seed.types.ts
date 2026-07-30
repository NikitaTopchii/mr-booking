export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

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

export interface DemoBookingSeedResult {
  readonly weekStart: string;
  readonly bookingCount: number;
  readonly slotCount: number;
}
