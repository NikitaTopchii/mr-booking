import {
  OFFICE_TIME_ZONE,
  generateBookingSlotStarts,
  normalizeBookingTitle,
  validateBookingInterval,
} from '@mr-booking/booking-domain';
import type { DatabaseConnection } from '@mr-booking/shared-database';
import { inArray } from 'drizzle-orm';
import { bookingSlots, bookings } from './booking-schema';
import type {
  CalendarDate,
  DemoBookingDefinition,
  DemoBookingSeedResult,
} from './types/demo-booking-seed.types';

export const demoBookingIds = [
  'demo-alice-planning',
  'demo-bob-standup',
  'demo-alice-design-review',
  'demo-bob-customer-call',
  'demo-alice-retrospective',
  'demo-bob-weekly-sync',
] as const;

const demoDefinitions: readonly DemoBookingDefinition[] = [
  {
    id: demoBookingIds[0],
    roomId: 'room-aquarium',
    authorUserId: 'user-alice',
    title: 'Weekly planning',
    dayOffset: 0,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: demoBookingIds[1],
    roomId: 'room-aquarium',
    authorUserId: 'user-bob',
    title: 'Team stand-up',
    dayOffset: 0,
    startHour: 11,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: demoBookingIds[2],
    roomId: 'room-mars',
    authorUserId: 'user-alice',
    title: 'Design review',
    dayOffset: 1,
    startHour: 14,
    startMinute: 0,
    durationMinutes: 90,
  },
  {
    id: demoBookingIds[3],
    roomId: 'room-aquarium',
    authorUserId: 'user-bob',
    title: 'Customer call',
    dayOffset: 2,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 60,
  },
  {
    id: demoBookingIds[4],
    roomId: 'room-mars',
    authorUserId: 'user-alice',
    title: 'Sprint retrospective',
    dayOffset: 3,
    startHour: 16,
    startMinute: 0,
    durationMinutes: 120,
  },
  {
    id: demoBookingIds[5],
    roomId: 'room-aquarium',
    authorUserId: 'user-bob',
    title: 'Weekly sync',
    dayOffset: 4,
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
  },
];

export function seedDemoBookings(
  connection: DatabaseConnection,
  configuredWeekStart?: string,
  nowUtc = Date.now(),
): DemoBookingSeedResult {
  const weekStart = configuredWeekStart
    ? parseMonday(configuredWeekStart)
    : nextOfficeMonday(nowUtc);
  const createdAtUtc = zonedDateTimeToEpoch(addDays(weekStart, -1), 12, 0) - 1;
  const records = demoDefinitions.map((definition) => {
    const date = addDays(weekStart, definition.dayOffset);
    const startsAtUtc = zonedDateTimeToEpoch(
      date,
      definition.startHour,
      definition.startMinute,
    );
    const endsAtUtc = startsAtUtc + definition.durationMinutes * 60_000;
    const interval = validateBookingInterval(
      startsAtUtc,
      endsAtUtc,
      createdAtUtc,
    );

    return {
      booking: {
        id: definition.id,
        roomId: definition.roomId,
        authorUserId: definition.authorUserId,
        title: normalizeBookingTitle(definition.title),
        startsAtUtc: interval.startsAtUtc,
        endsAtUtc: interval.endsAtUtc,
        createdAtUtc,
        cancelledAtUtc: null,
      },
      slotStartsAtUtc: generateBookingSlotStarts(interval),
    };
  });

  connection.withImmediateTransaction(() => {
    connection.drizzle
      .delete(bookings)
      .where(inArray(bookings.id, demoBookingIds))
      .run();

    for (const record of records) {
      connection.drizzle.insert(bookings).values(record.booking).run();
      connection.drizzle
        .insert(bookingSlots)
        .values(
          record.slotStartsAtUtc.map((slotStartsAtUtc) => ({
            bookingId: record.booking.id,
            roomId: record.booking.roomId,
            slotStartsAtUtc,
          })),
        )
        .run();
    }
  });

  return {
    weekStart: formatDate(weekStart),
    bookingCount: records.length,
    slotCount: records.reduce(
      (total, record) => total + record.slotStartsAtUtc.length,
      0,
    ),
  };
}

function parseMonday(value: string): CalendarDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);

  if (!match) {
    throw new Error(
      'DEMO_SEED_WEEK_START must be a valid Monday in YYYY-MM-DD format',
    );
  }

  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  const candidate = new Date(Date.UTC(date.year, date.month - 1, date.day));

  if (
    candidate.getUTCFullYear() !== date.year ||
    candidate.getUTCMonth() !== date.month - 1 ||
    candidate.getUTCDate() !== date.day ||
    candidate.getUTCDay() !== 1
  ) {
    throw new Error(
      'DEMO_SEED_WEEK_START must be a valid Monday in YYYY-MM-DD format',
    );
  }

  return date;
}

function nextOfficeMonday(nowUtc: number): CalendarDate {
  const today = calendarDateAt(nowUtc);
  const currentDay = new Date(
    Date.UTC(today.year, today.month - 1, today.day),
  ).getUTCDay();
  const daysUntilNextMonday = currentDay === 1 ? 7 : (8 - currentDay) % 7;
  return addDays(today, daysUntilNextMonday);
}

function addDays(date: CalendarDate, amount: number): CalendarDate {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + amount),
  );
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
}

function formatDate(date: CalendarDate): string {
  return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(
    2,
    '0',
  )}-${String(date.day).padStart(2, '0')}`;
}

function calendarDateAt(instant: number): CalendarDate {
  const parts = dateTimePartsAt(instant);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function zonedDateTimeToEpoch(
  date: CalendarDate,
  hour: number,
  minute: number,
): number {
  const target = Date.UTC(date.year, date.month - 1, date.day, hour, minute);
  let candidate = target;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = dateTimePartsAt(candidate);
    candidate +=
      target -
      Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
      );
  }

  const resolved = dateTimePartsAt(candidate);
  if (
    resolved.year !== date.year ||
    resolved.month !== date.month ||
    resolved.day !== date.day ||
    resolved.hour !== hour ||
    resolved.minute !== minute
  ) {
    throw new Error('Unable to resolve demo booking time in Europe/Kyiv');
  }

  return candidate;
}

function dateTimePartsAt(
  instant: number,
): CalendarDate & { readonly hour: number; readonly minute: number } {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: OFFICE_TIME_ZONE,
      calendar: 'gregory',
      numberingSystem: 'latn',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .filter(({ type }) =>
        ['year', 'month', 'day', 'hour', 'minute'].includes(type),
      )
      .map(({ type, value }) => [type, Number(value)]),
  );

  const year = values['year'];
  const month = values['month'];
  const day = values['day'];
  const hour = values['hour'];
  const minute = values['minute'];

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute)
  ) {
    throw new Error('Unable to read Europe/Kyiv calendar fields');
  }

  return {
    year: year as number,
    month: month as number,
    day: day as number,
    hour: hour as number,
    minute: minute as number,
  };
}
