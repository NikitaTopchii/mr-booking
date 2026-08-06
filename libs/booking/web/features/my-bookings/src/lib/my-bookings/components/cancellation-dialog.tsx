import { formatBookingDateTimeRange } from '@mr-booking/booking-ui';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mr-booking/shared-ui';
import { AlertCircle } from 'lucide-react';
import type { CancellationDialogProps } from '../types/my-bookings.types';

export function CancellationDialog({
  booking,
  locale,
  browserTimeZone,
  messages,
  error,
  pending,
  onDismiss,
  onConfirm,
}: CancellationDialogProps) {
  const errorMessage = error ? messages.cancellation.errors[error] : undefined;

  return (
    <Dialog
      open={Boolean(booking)}
      onOpenChange={(open) => !open && onDismiss()}
    >
      <DialogContent closeLabel={messages.cancellation.keep}>
        <DialogHeader>
          <DialogTitle>{messages.cancellation.title}</DialogTitle>
          <DialogDescription>
            {messages.cancellation.description}
          </DialogDescription>
        </DialogHeader>
        {booking ? (
          <div className="grid gap-2 border-y border-border py-4 text-sm">
            <strong>{booking.title}</strong>
            <span>{booking.room.name}</span>
            <span>
              {formatBookingDateTimeRange({
                startsAtUtc: booking.startsAtUtc,
                endsAtUtc: booking.endsAtUtc,
                locale,
                timeZone: browserTimeZone,
              })}
            </span>
            <p className="mt-1 text-muted-foreground">
              {messages.cancellation.consequence}
            </p>
          </div>
        ) : null}
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onDismiss}
          >
            {messages.cancellation.keep}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending
              ? messages.cancellation.confirming
              : messages.cancellation.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
