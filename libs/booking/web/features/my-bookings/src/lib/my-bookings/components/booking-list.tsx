import { MyBookingCard } from '@mr-booking/booking-ui';
import type { BookingListProps } from '../types/my-bookings.types';
import { createBookingScheduleHref } from '../navigation/create-booking-schedule-href';

export function BookingList({
  bookings,
  locale,
  browserTimeZone,
  messages,
  onCancel,
}: BookingListProps) {
  return (
    <ul className="grid gap-3">
      {bookings.map((booking) => (
        <MyBookingCard
          key={booking.id}
          booking={booking}
          href={createBookingScheduleHref(
            locale,
            booking.room.id,
            booking.startsAtUtc,
            browserTimeZone,
          )}
          locale={locale}
          browserTimeZone={browserTimeZone}
          messages={{
            openSchedule: messages.actions.openSchedule,
            cancel: messages.actions.cancel,
            floor: messages.floor,
            capacity: messages.capacity,
            statuses: messages.statuses,
          }}
          {...(onCancel ? { onCancel: () => onCancel(booking) } : {})}
        />
      ))}
    </ul>
  );
}
