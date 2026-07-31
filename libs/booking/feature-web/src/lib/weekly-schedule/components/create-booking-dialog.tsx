import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mr-booking/shared-ui';
import { AlertCircle } from 'lucide-react';
import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import { AdaptiveDialogContent } from './adaptive-dialog-content';
import {
  formatScheduleInstant,
  formatScheduleTimeRange,
} from '../formatting/schedule-date-time.formatter';
import type { CreateBookingDialogProps } from '../types/schedule-dialog.types';

export function CreateBookingDialog({
  locale,
  messages,
  room,
  browserTimeZone,
  creation,
  errorMessage,
}: CreateBookingDialogProps) {
  const slot = creation.selection?.slot;
  const quickDurations = [
    [1, messages.duration.thirtyMinutes],
    [2, messages.duration.oneHour],
    [3, messages.duration.ninetyMinutes],
    [4, messages.duration.twoHours],
  ] as const;
  return (
    <Dialog
      open={Boolean(slot)}
      onOpenChange={(open) => !open && creation.close()}
    >
      <AdaptiveDialogContent closeLabel={messages.close}>
        <DialogHeader>
          <DialogTitle>{messages.bookingTitle}</DialogTitle>
          <DialogDescription>
            {room.name} ·{' '}
            {slot
              ? formatScheduleInstant(slot.startsAtUtc, locale, browserTimeZone)
              : ''}
          </DialogDescription>
        </DialogHeader>
        {slot ? (
          <div className="grid gap-1 rounded-lg bg-muted p-3 text-sm">
            <span>
              {messages.mobile.browserTimezone}:{' '}
              {formatScheduleTimeRange(
                slot.startsAtUtc,
                creation.endsAt ? Date.parse(creation.endsAt) : slot.endsAtUtc,
                locale,
                browserTimeZone,
              )}
            </span>
            {browserTimeZone !== 'Europe/Kyiv' ? (
              <span>
                {messages.mobile.officeInterval}:{' '}
                {formatScheduleTimeRange(
                  slot.startsAtUtc,
                  creation.endsAt
                    ? Date.parse(creation.endsAt)
                    : slot.endsAtUtc,
                  locale,
                  'Europe/Kyiv',
                )}
              </span>
            ) : null}
          </div>
        ) : null}
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            creation.submit();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="booking-title">{messages.titleLabel}</Label>
            <Input
              id="booking-title"
              autoFocus
              maxLength={100}
              value={creation.title}
              aria-invalid={Boolean(errorMessage)}
              onChange={(event) => creation.setTitle(event.target.value)}
            />
          </div>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">
              {messages.duration.label}
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickDurations.map(([slotCount, label]) => {
                const value = slot
                  ? new Date(
                      slot.startsAtUtc + slotCount * BOOKING_SLOT_MILLISECONDS,
                    ).toISOString()
                  : '';
                const valid = creation.endOptions.includes(value);
                return (
                  <Button
                    key={slotCount}
                    type="button"
                    size="sm"
                    variant={creation.endsAt === value ? 'default' : 'outline'}
                    disabled={!valid}
                    onClick={() => creation.setEnd(value)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor="booking-end">{messages.duration.custom}</Label>
            <Select value={creation.endsAt} onValueChange={creation.setEnd}>
              <SelectTrigger id="booking-end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {creation.endOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatScheduleInstant(
                      Date.parse(option),
                      locale,
                      browserTimeZone,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errorMessage ? (
            <Alert variant="destructive" role="alert">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={creation.close}>
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={creation.pending}>
              {creation.pending ? messages.creating : messages.create}
            </Button>
          </DialogFooter>
        </form>
      </AdaptiveDialogContent>
    </Dialog>
  );
}
