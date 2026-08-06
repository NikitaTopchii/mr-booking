import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mr-booking/shared-ui';
import { AlertCircle, CalendarDays } from 'lucide-react';
import { AdaptiveDialogContent } from './adaptive-dialog-content';
import { formatScheduleInstant } from '../formatting/schedule-date-time.formatter';
import type { BookingDetailsDialogProps } from '../types/schedule-dialog.types';

export function BookingDetailsDialog({
  locale,
  messages,
  booking,
  room,
  browserTimeZone,
  confirming,
  canCancel,
  pending,
  error,
  onClose,
  onRequestConfirmation,
  onDismissConfirmation,
  onConfirmCancellation,
}: BookingDetailsDialogProps) {
  return (
    <Dialog open={Boolean(booking)} onOpenChange={(open) => !open && onClose()}>
      <AdaptiveDialogContent closeLabel={messages.close}>
        <DialogHeader>
          <DialogTitle>{booking?.title ?? messages.bookingDetails}</DialogTitle>
          <DialogDescription>
            {booking?.isMine ? messages.yourBooking : messages.bookingDetails}
          </DialogDescription>
        </DialogHeader>
        {booking ? (
          <dl className="grid divide-y divide-border border-y border-border text-sm">
            <Detail
              label={messages.roomDetailsLabel}
              value={booking.roomId === room?.id ? (room?.name ?? '—') : '—'}
            />
            <Detail
              label={messages.startLabel}
              value={formatScheduleInstant(
                Date.parse(booking.startsAtUtc),
                locale,
                browserTimeZone,
              )}
            />
            <Detail
              label={messages.endLabel}
              value={formatScheduleInstant(
                Date.parse(booking.endsAtUtc),
                locale,
                browserTimeZone,
              )}
            />
            <Detail label={messages.bookedBy} value={booking.author.name} />
          </dl>
        ) : null}
        {confirming ? (
          <Alert>
            <CalendarDays aria-hidden="true" />
            <AlertDescription>{messages.cancelConfirmation}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          {confirming ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onDismissConfirmation}
              >
                {messages.keepBooking}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onConfirmCancellation}
              >
                {pending ? messages.cancelling : messages.cancelBooking}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                {messages.close}
              </Button>
              {canCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={onRequestConfirmation}
                >
                  {messages.cancelBooking}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </AdaptiveDialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="grid gap-1 py-3 first:pt-3 last:pb-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
