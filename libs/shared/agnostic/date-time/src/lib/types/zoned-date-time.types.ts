import type { CalendarDate } from './calendar-date.types';

export type ZonedDateTimeDisambiguation = 'earlier' | 'later' | 'reject';

export type ZonedDateTimeErrorCode =
  | 'AMBIGUOUS_LOCAL_DATE_TIME'
  | 'INVALID_EPOCH_INSTANT'
  | 'INVALID_LOCAL_DATE_TIME'
  | 'INVALID_TIME_ZONE'
  | 'NONEXISTENT_LOCAL_DATE_TIME';

export interface ZonedDateTimeInput {
  readonly date: CalendarDate;
  readonly hour: number;
  readonly minute: number;
}

export interface ZonedDateTimeParts extends CalendarDate {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}
