'use client';

import {
  BookingClientError,
  bookingKeys,
  cancelBooking,
  isScheduleKeyForRoom,
  listMyPastBookings,
  listMyUpcomingBookings,
  type MyBooking,
} from '@mr-booking/booking-data-access-web';
import {
  createScheduleBookingHref,
  MyBookingCard,
} from '@mr-booking/booking-ui';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@mr-booking/shared-ui';
import { AlertCircle, CalendarPlus, History } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRInfinite from 'swr/infinite';
import useSWRMutation from 'swr/mutation';
import type {
  BookingListProps,
  BookingSectionProps,
  CancelBookingMutationOptions,
  CancellationDialogProps,
  MyBookingsEmptyStateProps,
  MyBookingsErrorStateProps,
  MyBookingsLoadingStateProps,
  MyBookingsProps,
} from './types/my-bookings.types';
import { useBrowserTimeZone } from './use-browser-time-zone';

const PAST_PAGE_SIZE = 20;

export function MyBookings({ locale, messages }: MyBookingsProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [selectedBooking, setSelectedBooking] = useState<MyBooking>();
  const [cancellationError, setCancellationError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const browserTimeZone = useBrowserTimeZone();
  const upcoming = useSWR(bookingKeys.mineUpcoming(), listMyUpcomingBookings, {
    revalidateOnFocus: true,
  });
  const past = useSWRInfinite(
    (pageIndex, previousPage) => {
      if (pageIndex > 0 && !previousPage?.nextCursor) {
        return null;
      }
      return bookingKeys.minePast(
        pageIndex === 0 ? null : (previousPage?.nextCursor ?? null),
        PAST_PAGE_SIZE,
      );
    },
    (key) => listMyPastBookings(key[3], key[4]),
    { revalidateFirstPage: false },
  );
  const cancellation = useSWRMutation(
    ['booking', 'mine', 'cancel'],
    (_key, { arg }: CancelBookingMutationOptions) => cancelBooking(arg),
  );
  const pastItems = deduplicateBookings(
    past.data?.flatMap(({ items }) => items) ?? [],
  );
  const nextCursor = past.data?.[past.data.length - 1]?.nextCursor;
  const isLoadingMore =
    past.isValidating &&
    past.data !== undefined &&
    past.size > past.data.length;

  const redirectIfUnauthenticated = (error: unknown): boolean => {
    if (
      error instanceof BookingClientError &&
      (error.code === 'UNAUTHENTICATED' || error.status === 401)
    ) {
      router.replace(`/${locale}/login`);
      return true;
    }
    return false;
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;
    setCancellationError(undefined);

    try {
      await cancellation.trigger(selectedBooking.id);
      await upcoming.mutate();
      await mutate((key) => isScheduleKeyForRoom(key, selectedBooking.room.id));
      setSelectedBooking(undefined);
      setNotice(messages.cancellation.success);
    } catch (error) {
      if (redirectIfUnauthenticated(error)) {
        setCancellationError(messages.cancellation.errors.unauthenticated);
        return;
      }
      if (
        error instanceof BookingClientError &&
        error.code === 'BOOKING_NOT_FOUND'
      ) {
        await upcoming.mutate();
        setCancellationError(messages.cancellation.errors.stale);
        return;
      }
      if (
        error instanceof BookingClientError &&
        error.code === 'BOOKING_NOT_CANCELLABLE'
      ) {
        await upcoming.mutate();
        setCancellationError(messages.cancellation.errors.notCancellable);
        return;
      }
      setCancellationError(messages.cancellation.errors.service);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-6xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {messages.description}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.localTime}: {browserTimeZone}
        </p>
      </header>

      {notice ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
        >
          {notice}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6">
        <BookingSection
          id="upcoming-bookings"
          title={messages.upcoming.title}
          icon={CalendarPlus}
        >
          {upcoming.isLoading ? (
            <LoadingState message={messages.loading} />
          ) : upcoming.error ? (
            <ErrorState
              message={messages.upcoming.error}
              retry={messages.retry}
              onRetry={() => {
                if (!redirectIfUnauthenticated(upcoming.error)) {
                  void upcoming.mutate();
                }
              }}
            />
          ) : (upcoming.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              title={messages.upcoming.emptyTitle}
              description={messages.upcoming.emptyDescription}
              action={{
                href: `/${locale}/schedule`,
                label: messages.actions.viewSchedule,
              }}
            />
          ) : (
            <BookingList
              bookings={upcoming.data?.items ?? []}
              locale={locale}
              browserTimeZone={browserTimeZone}
              messages={messages}
              onCancel={(booking) => {
                setCancellationError(undefined);
                setSelectedBooking(booking);
              }}
            />
          )}
        </BookingSection>

        <BookingSection
          id="past-bookings"
          title={messages.past.title}
          icon={History}
        >
          {past.isLoading ? (
            <LoadingState message={messages.loading} />
          ) : past.error && pastItems.length === 0 ? (
            <ErrorState
              message={messages.past.error}
              retry={messages.retry}
              onRetry={() => {
                if (!redirectIfUnauthenticated(past.error)) {
                  void past.mutate();
                }
              }}
            />
          ) : pastItems.length === 0 ? (
            <EmptyState
              title={messages.past.emptyTitle}
              description={messages.past.emptyDescription}
            />
          ) : (
            <>
              <BookingList
                bookings={pastItems}
                locale={locale}
                browserTimeZone={browserTimeZone}
                messages={messages}
                onCancel={() => undefined}
              />
              {past.error ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>
                    {messages.past.loadMoreError}
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="mt-5 flex justify-center">
                {nextCursor ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoadingMore}
                    onClick={() => void past.setSize((size) => size + 1)}
                  >
                    {isLoadingMore ? messages.loadingMore : messages.loadMore}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground" role="status">
                    {messages.endOfHistory}
                  </p>
                )}
              </div>
            </>
          )}
        </BookingSection>
      </div>

      <CancellationDialog
        booking={selectedBooking}
        locale={locale}
        browserTimeZone={browserTimeZone}
        messages={messages}
        error={cancellationError}
        pending={cancellation.isMutating}
        onOpenChange={(open) => {
          if (!open && !cancellation.isMutating) {
            setSelectedBooking(undefined);
            setCancellationError(undefined);
          }
        }}
        onConfirm={() => void confirmCancellation()}
      />
    </main>
  );
}

function BookingSection({
  id,
  title,
  icon: Icon,
  children,
}: BookingSectionProps) {
  return (
    <Card aria-labelledby={`${id}-title`}>
      <CardHeader className="border-b border-border">
        <h2
          id={`${id}-title`}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight"
        >
          <Icon aria-hidden="true" className="size-5" />
          {title}
        </h2>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function BookingList({
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
          href={createScheduleBookingHref(
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
          onCancel={() => onCancel(booking)}
        />
      ))}
    </ul>
  );
}

function CancellationDialog({
  booking,
  locale,
  browserTimeZone,
  messages,
  error,
  pending,
  onOpenChange,
  onConfirm,
}: CancellationDialogProps) {
  const localTime = booking
    ? new Intl.DateTimeFormat(locale, {
        timeZone: browserTimeZone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(Date.parse(booking.startsAtUtc))
    : '';

  return (
    <Dialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.cancellation.keep}>
        <DialogHeader>
          <DialogTitle>{messages.cancellation.title}</DialogTitle>
          <DialogDescription>
            {messages.cancellation.description}
          </DialogDescription>
        </DialogHeader>
        {booking ? (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <strong>{booking.title}</strong>
            <span>{booking.room.name}</span>
            <span>{localTime}</span>
            <p className="mt-1 text-muted-foreground">
              {messages.cancellation.consequence}
            </p>
          </div>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
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

function LoadingState({ message }: MyBookingsLoadingStateProps) {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <Spinner />
      {message}
    </div>
  );
}

function ErrorState({ message, retry, onRetry }: MyBookingsErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          {retry}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function EmptyState({ title, description, action }: MyBookingsEmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <Button asChild className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function deduplicateBookings(
  bookings: readonly MyBooking[],
): readonly MyBooking[] {
  return [
    ...new Map(bookings.map((booking) => [booking.id, booking])).values(),
  ];
}
