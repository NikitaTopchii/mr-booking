export interface OfficeCalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface OfficeDateTimeInput {
  readonly date: OfficeCalendarDate;
  readonly hour: number;
  readonly minute: number;
}

export interface OfficeDateTimeParts extends OfficeCalendarDate {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}
