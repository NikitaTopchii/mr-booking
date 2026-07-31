import {
  BOOKING_SLOT_MILLISECONDS,
  OFFICE_CLOSING_MINUTE,
  OFFICE_OPENING_MINUTE,
  OFFICE_TIME_ZONE,
  isOfficeWeekStart,
  startOfOfficeWeek,
} from '@mr-booking/booking-domain';
import {
  addCalendarDays,
  formatCalendarDate,
  parseCalendarDate,
  type CalendarDate,
} from '@mr-booking/shared-date-time';
import { calendarDateAt, zonedDateTimeToEpoch } from './schedule-zoned-time';
import type {
  SchedulePresentation,
  ScheduleRange,
  ScheduleSlot,
} from './types/schedule.types';

export function createScheduleWeek(
  weekKey: string,
  browserTimeZone: string,
): ScheduleRange {
  const weekStart = parseCalendarDate(weekKey);
  if (!weekStart || !isOfficeWeekStart(weekStart)) {
    throw new Error('INVALID_WEEK');
  }
  return createScheduleRange(weekStart, 7, browserTimeZone);
}

export function createScheduleRange(
  selectedDate: CalendarDate,
  visibleDayCount: 1 | 3 | 7,
  browserTimeZone: string,
): ScheduleRange {
  const visibleDates = Array.from({ length: visibleDayCount }, (_, index) =>
    addCalendarDays(selectedDate, index),
  );
  const firstVisibleKey = formatCalendarDate(visibleDates[0] as CalendarDate);
  const lastVisibleKey = formatCalendarDate(
    visibleDates[visibleDates.length - 1] as CalendarDate,
  );
  const slots: ScheduleSlot[] = [];

  for (let offset = -2; offset <= visibleDayCount + 1; offset += 1) {
    const officeDate = addCalendarDays(selectedDate, offset);
    const officeDateKey = formatCalendarDate(officeDate);
    const opensAt = zonedDateTimeToEpoch(
      officeDate,
      Math.floor(OFFICE_OPENING_MINUTE / 60),
      OFFICE_OPENING_MINUTE % 60,
      OFFICE_TIME_ZONE,
    );
    const closesAt = zonedDateTimeToEpoch(
      officeDate,
      Math.floor(OFFICE_CLOSING_MINUTE / 60),
      OFFICE_CLOSING_MINUTE % 60,
      OFFICE_TIME_ZONE,
    );

    for (
      let startsAtUtc = opensAt;
      startsAtUtc < closesAt;
      startsAtUtc += BOOKING_SLOT_MILLISECONDS
    ) {
      const browserDateKey = formatCalendarDate(
        calendarDateAt(startsAtUtc, browserTimeZone),
      );
      if (
        browserDateKey >= firstVisibleKey &&
        browserDateKey <= lastVisibleKey
      ) {
        slots.push({
          id: `${officeDateKey}:${startsAtUtc}`,
          officeDate: officeDateKey,
          startsAtUtc,
          endsAtUtc: startsAtUtc + BOOKING_SLOT_MILLISECONDS,
        });
      }
    }
  }

  slots.sort((left, right) => left.startsAtUtc - right.startsAtUtc);
  if (slots.length === 0) throw new Error('EMPTY_WEEK');

  return {
    weekKey: formatCalendarDate(startOfOfficeWeek(selectedDate)),
    selectedDate,
    visibleDates,
    slots,
    range: {
      fromUtc: new Date(
        zonedDateTimeToEpoch(selectedDate, 0, 0, browserTimeZone),
      ).toISOString(),
      toUtc: new Date(
        zonedDateTimeToEpoch(
          addCalendarDays(selectedDate, visibleDayCount),
          0,
          0,
          browserTimeZone,
        ),
      ).toISOString(),
    },
  };
}

export function visibleDayCount(presentation: SchedulePresentation): 1 | 3 | 7 {
  if (presentation === 'compact') return 1;
  if (presentation === 'medium') return 3;
  return 7;
}

export function createPresentationRange(
  selectedDate: CalendarDate,
  presentation: SchedulePresentation,
  browserTimeZone: string,
): ScheduleRange {
  const rangeStart =
    presentation === 'expanded'
      ? startOfOfficeWeek(selectedDate)
      : selectedDate;
  return createScheduleRange(
    rangeStart,
    visibleDayCount(presentation),
    browserTimeZone,
  );
}
