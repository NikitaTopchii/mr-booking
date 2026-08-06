import type { BookingListProps } from '../types/my-bookings.types';
import { createBookingScheduleHref } from '../navigation/create-booking-schedule-href';
import { BookingListItem } from './booking-list-item';

export function BookingList({
  bookings,
  locale,
  browserTimeZone,
  messages,
  onCancel,
}: BookingListProps) {
  return (
    <ul>
      {bookings.map((booking) => (
        <BookingListItem
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
          messages={messages}
          {...(onCancel ? { onCancel: () => onCancel(booking) } : {})}
        />
      ))}
    </ul>
  );
}
