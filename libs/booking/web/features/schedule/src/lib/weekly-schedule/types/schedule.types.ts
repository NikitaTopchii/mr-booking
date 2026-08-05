import type { CalendarDate } from '@mr-booking/shared-date-time';

export interface ScheduleSlot {
  readonly id: string;
  readonly officeDate: string;
  readonly startsAtUtc: number;
  readonly endsAtUtc: number;
}

export type SchedulePresentation = 'compact' | 'medium' | 'expanded';

export interface ScheduleRange {
  readonly weekKey: string;
  readonly selectedDate: CalendarDate;
  readonly visibleDates: readonly CalendarDate[];
  readonly slots: readonly ScheduleSlot[];
  readonly range: {
    readonly fromUtc: string;
    readonly toUtc: string;
  };
}

export interface ScheduleNavigation {
  readonly roomId?: string;
  readonly date: string;
}
