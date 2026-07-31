import type { ScheduleBooking } from '@mr-booking/booking-data-access-web';
import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import {
  calendarDateAt,
  currentTimePosition,
  type CalendarDate,
  type ScheduleRange,
  type ScheduleSlot,
  type SchedulePresentation,
} from '@mr-booking/booking-ui';
import type { Locale } from '@mr-booking/shared-i18n';
import { formatScheduleTimeRange } from '../formatting/schedule-date-time.formatter';

export interface PreparedScheduleBooking {
  readonly booking: ScheduleBooking;
  readonly startsAt: number;
  readonly endsAt: number;
  readonly timeRange: string;
}

export interface ScheduleDayViewModel {
  readonly date: CalendarDate;
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly PreparedScheduleBooking[];
  readonly nowPosition: number | undefined;
  readonly nowUtc: number;
}

export interface ScheduleViewModel {
  readonly days: readonly ScheduleDayViewModel[];
  readonly rowCount: number;
  readonly firstFocusable: string | undefined;
  readonly rowHeightRem: number;
  readonly occupiedBySlotId: ReadonlyMap<string, ScheduleBooking>;
}

export function createScheduleViewModel({
  schedule,
  presentation,
  bookings,
  now,
  browserTimeZone,
  locale,
}: {
  readonly schedule: ScheduleRange;
  readonly presentation: SchedulePresentation;
  readonly bookings: readonly ScheduleBooking[];
  readonly now: number;
  readonly browserTimeZone: string;
  readonly locale: Locale;
}): ScheduleViewModel {
  const slotsByDate = new Map<string, ScheduleSlot[]>();
  for (const date of schedule.visibleDates) {
    slotsByDate.set(formatDateKey(date), []);
  }
  for (const slot of schedule.slots) {
    const key = formatDateKey(
      calendarDateAt(slot.startsAtUtc, browserTimeZone),
    );
    slotsByDate.get(key)?.push(slot);
  }

  const preparedBookings = bookings
    .map((booking) => {
      const startsAt = Date.parse(booking.startsAtUtc);
      const endsAt = Date.parse(booking.endsAtUtc);
      return {
        booking,
        startsAt,
        endsAt,
        timeRange: formatScheduleTimeRange(
          startsAt,
          endsAt,
          locale,
          browserTimeZone,
        ),
      };
    })
    .sort((left, right) => left.startsAt - right.startsAt);
  const bookingsByDate = new Map<string, PreparedScheduleBooking[]>();
  for (const prepared of preparedBookings) {
    const key = formatDateKey(
      calendarDateAt(prepared.startsAt, browserTimeZone),
    );
    const dayBookings = bookingsByDate.get(key) ?? [];
    dayBookings.push(prepared);
    bookingsByDate.set(key, dayBookings);
  }

  const slotsByStart = new Map(
    schedule.slots.map((slot) => [slot.startsAtUtc, slot] as const),
  );
  const occupiedBySlotId = new Map<string, ScheduleBooking>();
  for (const prepared of preparedBookings) {
    for (
      let startsAt = prepared.startsAt;
      startsAt < prepared.endsAt;
      startsAt += BOOKING_SLOT_MILLISECONDS
    ) {
      const slot = slotsByStart.get(startsAt);
      if (slot) occupiedBySlotId.set(slot.id, prepared.booking);
    }
  }

  const rowCount = Math.max(
    ...Array.from(slotsByDate.values()).map((slots) => slots.length),
    1,
  );
  const days = schedule.visibleDates.map((date) => {
    const slots = slotsByDate.get(formatDateKey(date)) ?? [];
    const dayBookings = bookingsByDate.get(formatDateKey(date)) ?? [];
    return {
      date,
      slots,
      bookings: dayBookings,
      nowPosition: currentTimePosition(now, slots[0], slots.at(-1)),
      nowUtc: now,
    };
  });
  const firstFocusable = schedule.slots.find(
    (slot) => slot.startsAtUtc > now && !occupiedBySlotId.has(slot.id),
  )?.id;
  return {
    days,
    rowCount,
    firstFocusable,
    rowHeightRem: presentation === 'compact' ? 4.25 : 3.5,
    occupiedBySlotId,
  };
}

function formatDateKey(date: CalendarDate): string {
  return `${date.year.toString().padStart(4, '0')}-${date.month
    .toString()
    .padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
}
