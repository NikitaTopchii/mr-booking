import {
  BookingStartNotInFutureError,
  addOfficeCalendarDays,
  formatOfficeCalendarDate,
  generateBookingSlotStarts,
  getOfficeCalendarDate,
  isOfficeCalendarMonday,
  normalizeBookingTitle,
  parseOfficeCalendarDate,
  validateBookingInterval,
} from '@mr-booking/booking-domain';
import type { OfficeCalendarDate } from '@mr-booking/booking-domain';
import type {
  CreateDemoBookingSeedPlanInput,
  DemoBookingSeedBookingRecord,
  DemoBookingSeedConfigurationErrorCode,
  DemoBookingSeedPlan,
  DemoBookingSeedSlotRecord,
} from './types/demo-booking-seed.types';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const DEMO_CREATED_AT_LOCAL_HOUR = 12;
const invalidWeekStartMessage =
  'DEMO_SEED_WEEK_START must be a valid Monday in YYYY-MM-DD format';

export class DemoBookingSeedConfigurationError extends Error {
  public constructor(
    public readonly code: DemoBookingSeedConfigurationErrorCode,
  ) {
    super(
      code === 'DEMO_SEED_INVALID_WEEK_START'
        ? invalidWeekStartMessage
        : 'DEMO_SEED_WEEK_START must resolve to future demo bookings',
    );
    this.name = 'DemoBookingSeedConfigurationError';
  }
}

export function resolveDemoSeedWeekStart(
  configuredWeekStart: string | undefined,
  nowUtc: number,
): OfficeCalendarDate {
  if (configuredWeekStart !== undefined) {
    return parseConfiguredDemoWeekStart(configuredWeekStart);
  }

  return getNextOfficeWeekStart(nowUtc);
}

export function createDemoBookingSeedPlan({
  definitions,
  weekStart,
  validationNowUtc,
  toUtcInstant,
}: CreateDemoBookingSeedPlanInput): DemoBookingSeedPlan {
  const createdAtUtc = toUtcInstant({
    date: addOfficeCalendarDays(weekStart, -1),
    hour: DEMO_CREATED_AT_LOCAL_HOUR,
    minute: 0,
  });
  const demoBookingRecords: DemoBookingSeedBookingRecord[] = [];
  const demoBookingSlotRecords: DemoBookingSeedSlotRecord[] = [];

  for (const definition of definitions) {
    const bookingDate = addOfficeCalendarDays(weekStart, definition.dayOffset);
    const startsAtUtc = toUtcInstant({
      date: bookingDate,
      hour: definition.startHour,
      minute: definition.startMinute,
    });
    const endLocalMinutes =
      definition.startHour * MINUTES_PER_HOUR +
      definition.startMinute +
      definition.durationMinutes;
    const endDate = addOfficeCalendarDays(
      bookingDate,
      Math.floor(endLocalMinutes / MINUTES_PER_DAY),
    );
    const endMinuteOfDay =
      ((endLocalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
    const endsAtUtc = toUtcInstant({
      date: endDate,
      hour: Math.floor(endMinuteOfDay / MINUTES_PER_HOUR),
      minute: endMinuteOfDay % MINUTES_PER_HOUR,
    });

    try {
      const interval = validateBookingInterval(
        startsAtUtc,
        endsAtUtc,
        validationNowUtc,
      );
      const booking: DemoBookingSeedBookingRecord = {
        id: definition.id,
        roomId: definition.roomId,
        authorUserId: definition.authorUserId,
        title: normalizeBookingTitle(definition.title),
        startsAtUtc: interval.startsAtUtc,
        endsAtUtc: interval.endsAtUtc,
        createdAtUtc,
        cancelledAtUtc: null,
      };
      demoBookingRecords.push(booking);
      demoBookingSlotRecords.push(
        ...generateBookingSlotStarts(interval).map((slotStartsAtUtc) => ({
          bookingId: booking.id,
          roomId: booking.roomId,
          slotStartsAtUtc,
        })),
      );
    } catch (error) {
      if (error instanceof BookingStartNotInFutureError) {
        throw new DemoBookingSeedConfigurationError(
          'DEMO_SEED_WEEK_NOT_FUTURE',
        );
      }

      throw error;
    }
  }

  return {
    bookings: demoBookingRecords,
    bookingSlots: demoBookingSlotRecords,
    summary: {
      weekStart: formatOfficeCalendarDate(weekStart),
      bookingCount: demoBookingRecords.length,
      slotCount: demoBookingSlotRecords.length,
    },
  };
}

function parseConfiguredDemoWeekStart(value: string): OfficeCalendarDate {
  const weekStart = parseOfficeCalendarDate(value);

  if (!weekStart || !isOfficeCalendarMonday(weekStart)) {
    throw new DemoBookingSeedConfigurationError('DEMO_SEED_INVALID_WEEK_START');
  }

  return weekStart;
}

function getNextOfficeWeekStart(nowUtc: number): OfficeCalendarDate {
  const officeToday = getOfficeCalendarDate(nowUtc);
  const currentDay = new Date(
    Date.UTC(officeToday.year, officeToday.month - 1, officeToday.day),
  ).getUTCDay();
  const daysUntilNextMonday = currentDay === 1 ? 7 : (8 - currentDay) % 7;

  return addOfficeCalendarDays(officeToday, daysUntilNextMonday);
}
