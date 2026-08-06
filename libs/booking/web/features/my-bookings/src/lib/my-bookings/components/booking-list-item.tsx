import { formatBookingDateTimeRange } from '@mr-booking/booking-ui';
import { Button } from '@mr-booking/shared-ui';
import { Clock3, MapPin, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { BookingListItemProps } from '../types/my-bookings.types';

export function BookingListItem({
  booking,
  href,
  locale,
  browserTimeZone,
  messages,
  onCancel,
}: BookingListItemProps) {
  const isInProgress = booking.status === 'IN_PROGRESS';

  return (
    <li className="border-b border-border last:border-b-0">
      <article className="grid gap-3 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <Link
          href={href}
          aria-label={`${messages.actions.openSchedule}: ${booking.title}`}
          className="group grid min-w-0 gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:col-span-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center sm:gap-4"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold tabular-nums">
            <Clock3 aria-hidden="true" className="size-4 text-primary" />
            {formatBookingDateTimeRange({
              startsAtUtc: booking.startsAtUtc,
              endsAtUtc: booking.endsAtUtc,
              locale,
              timeZone: browserTimeZone,
            })}
          </span>
          {isInProgress ? (
            <span className="text-xs font-medium text-muted-foreground">
              {messages.statuses.IN_PROGRESS}
            </span>
          ) : null}
          <span className="min-w-0">
            <span className="min-w-0">
              <strong className="block break-words font-semibold">
                {booking.title}
              </strong>
              <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-4" />
                  {booking.room.name}
                </span>
                <span>
                  {messages.floor} {booking.room.floor}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users aria-hidden="true" className="size-4" />
                  {booking.room.capacity} {messages.capacity}
                </span>
              </span>
            </span>
          </span>
        </Link>

        {booking.canCancel && onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/60 bg-destructive/10 font-semibold text-destructive hover:border-destructive hover:bg-destructive/15 hover:text-destructive active:bg-destructive/20 sm:w-fit sm:justify-center"
            onClick={onCancel}
          >
            <X aria-hidden="true" />
            {messages.actions.cancel}
          </Button>
        ) : null}
      </article>
    </li>
  );
}
