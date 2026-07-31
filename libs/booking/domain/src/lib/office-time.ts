import {
  IntlZonedDateTimeAdapter,
  ZonedDateTimeError,
} from '@mr-booking/shared-date-time';
import type {
  OfficeCalendarDate,
  OfficeDateTimeInput,
  OfficeDateTimeParts,
} from './types/office-time.types';

export const OFFICE_TIME_ZONE = 'Europe/Kyiv';

const officeTime = new IntlZonedDateTimeAdapter(OFFICE_TIME_ZONE, 'later');

export class InvalidOfficeDateTimeError extends Error {
  public constructor() {
    super('INVALID_OFFICE_DATE_TIME');
    this.name = 'InvalidOfficeDateTimeError';
  }
}

export function getOfficeCalendarDate(instantUtc: number): OfficeCalendarDate {
  const parts = getOfficeDateTimeParts(instantUtc);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getOfficeDateTimeParts(
  instantUtc: number,
): OfficeDateTimeParts {
  try {
    return officeTime.partsAt(instantUtc);
  } catch (error) {
    rethrowOfficeError(error);
  }
}

export function officeDateTimeToUtcInstant(input: OfficeDateTimeInput): number {
  try {
    return officeTime.toUtcInstant(input);
  } catch (error) {
    rethrowOfficeError(error);
  }
}

function rethrowOfficeError(error: unknown): never {
  if (error instanceof ZonedDateTimeError) {
    throw new InvalidOfficeDateTimeError();
  }
  throw error;
}
