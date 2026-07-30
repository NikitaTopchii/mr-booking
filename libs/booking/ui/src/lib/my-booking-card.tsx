import { Button } from '@mr-booking/shared-ui';
import { Clock3, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import type { JSX } from 'react';
import type { MyBookingCardProps } from './types/my-booking-card.types';

export function MyBookingCard({
  booking,
  href,
  locale,
  browserTimeZone,
  messages,
  onCancel,
}: MyBookingCardProps): JSX.Element {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: browserTimeZone,
    dateStyle: 'medium',
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: browserTimeZone,
    hour: '2-digit',
    minute: '2-digit',
  });
  const startsAtUtc = Date.parse(booking.startsAtUtc);
  const endsAtUtc = Date.parse(booking.endsAtUtc);

  return (
    <li>
      <article className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={href}
          aria-label={`${messages.openSchedule}: ${booking.title}`}
          className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 break-words font-semibold">
              {booking.title}
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {messages.statuses[booking.status]}
            </span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span>{booking.room.name}</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4" />
              {dateFormatter.format(startsAtUtc)} ·{' '}
              {timeFormatter.format(startsAtUtc)}–
              {timeFormatter.format(endsAtUtc)}
            </span>
            <span>
              {messages.floor} {booking.room.floor}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4" />
              {booking.room.capacity} {messages.capacity}
            </span>
          </p>
        </Link>
        {booking.canCancel ? (
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 shrink-0"
            onClick={onCancel}
          >
            {messages.cancel}
          </Button>
        ) : null}
      </article>
    </li>
  );
}
