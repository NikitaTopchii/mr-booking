'use client';

import {
  BookingClientError,
  bookingKeys,
  cancelBooking,
  createBooking,
  listRoomBookings,
  listRooms,
  type CreateBookingInput,
  type Room,
  type ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import {
  SLOT_DURATION_MS,
  addCalendarDays,
  calendarDateAt,
  createScheduleWeek,
  formatCalendarDate,
  isMonday,
  parseCalendarDate,
  startOfLocalWeek,
  type ScheduleSlot,
  type ScheduleWeek,
} from '@mr-booking/booking-ui';
import type { AppDictionary, Locale } from '@mr-booking/shared-i18n';
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@mr-booking/shared-ui';
import {
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Users,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

type ScheduleMessages = AppDictionary['schedule'];

export interface WeeklyScheduleProps {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
}

interface BookingSelection {
  readonly slot: ScheduleSlot;
}

export function WeeklySchedule({ locale, messages }: WeeklyScheduleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    [],
  );
  const currentWeekKey = useMemo(
    () => formatCalendarDate(startOfLocalWeek(Date.now(), browserTimeZone)),
    [browserTimeZone],
  );
  const requestedWeek = searchParams.get('week');
  const parsedWeek = requestedWeek
    ? parseCalendarDate(requestedWeek)
    : undefined;
  const weekKey: string =
    requestedWeek !== null && parsedWeek && isMonday(parsedWeek)
      ? requestedWeek
      : currentWeekKey;
  const week = useMemo(
    () => createScheduleWeek(weekKey, browserTimeZone),
    [browserTimeZone, weekKey],
  );
  const requestedRoomId = searchParams.get('roomId') ?? '';
  const [now, setNow] = useState(() => Date.now());
  const [selection, setSelection] = useState<BookingSelection>();
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking>();
  const [notice, setNotice] = useState<string>();

  const roomsQuery = useSWR(bookingKeys.rooms(), listRooms, {
    revalidateOnFocus: false,
  });
  const rooms = roomsQuery.data ?? [];
  const selectedRoom =
    rooms.find(({ id }) => id === requestedRoomId) ?? rooms[0];
  const scheduleQuery = useSWR(
    selectedRoom ? bookingKeys.schedule(selectedRoom.id, week.range) : null,
    () => listRoomBookings(selectedRoom?.id ?? '', week.range),
    { keepPreviousData: true },
  );

  const updateQuery = useCallback(
    (updates: Readonly<Record<string, string>>, replace = false) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        next.set(key, value);
      }

      const href = `?${next.toString()}`;
      if (replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (requestedWeek !== weekKey) {
      updateQuery({ week: weekKey }, true);
    }
  }, [requestedWeek, updateQuery, weekKey]);

  useEffect(() => {
    if (selectedRoom && requestedRoomId !== selectedRoom.id) {
      updateQuery({ roomId: selectedRoom.id }, true);
    }
  }, [requestedRoomId, selectedRoom, updateQuery]);

  useEffect(() => {
    const error = roomsQuery.error ?? scheduleQuery.error;
    if (isUnauthenticated(error)) {
      router.replace(`/${locale}/login`);
    }
  }, [locale, roomsQuery.error, router, scheduleQuery.error]);

  const moveWeek = (days: number) => {
    const start = parseCalendarDate(weekKey);
    if (start) {
      updateQuery({ week: formatCalendarDate(addCalendarDays(start, days)) });
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {messages.title}
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            {messages.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" className="size-4" />
            {messages.officeHours}
          </span>
          <span>
            {messages.localTime}: {browserTimeZone}
          </span>
        </div>
      </div>

      <section aria-label={messages.title} className="py-5">
        <ScheduleToolbar
          locale={locale}
          messages={messages}
          rooms={rooms}
          room={selectedRoom}
          week={week}
          loadingRooms={roomsQuery.isLoading}
          onRoomChange={(roomId) => updateQuery({ roomId })}
          onPrevious={() => moveWeek(-7)}
          onCurrent={() => updateQuery({ week: currentWeekKey })}
          onNext={() => moveWeek(7)}
        />

        {notice ? (
          <p
            role="status"
            className="mt-4 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
          >
            {notice}
          </p>
        ) : null}

        {roomsQuery.isLoading ? (
          <LoadingState message={messages.loadingRooms} />
        ) : roomsQuery.error ? (
          <ErrorState
            message={messages.errors.rooms}
            retry={messages.retry}
            onRetry={() => void roomsQuery.mutate()}
          />
        ) : rooms.length === 0 ? (
          <EmptyState message={messages.emptyRooms} />
        ) : scheduleQuery.isLoading && !scheduleQuery.data ? (
          <LoadingState message={messages.loadingSchedule} />
        ) : scheduleQuery.error ? (
          <ErrorState
            message={messages.errors.schedule}
            retry={messages.retry}
            onRetry={() => void scheduleQuery.mutate()}
          />
        ) : selectedRoom ? (
          <>
            {(scheduleQuery.data?.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                {messages.emptySchedule}
              </p>
            ) : null}
            <ScheduleGrid
              locale={locale}
              messages={messages}
              week={week}
              bookings={scheduleQuery.data ?? []}
              now={now}
              browserTimeZone={browserTimeZone}
              revalidating={scheduleQuery.isValidating}
              onSelectSlot={(slot) => {
                setNotice(undefined);
                setSelection({ slot });
              }}
              onSelectBooking={(booking) => {
                setNotice(undefined);
                setSelectedBooking(booking);
              }}
            />
          </>
        ) : null}
      </section>

      {selectedRoom ? (
        <CreateBookingDialog
          locale={locale}
          messages={messages}
          room={selectedRoom}
          selection={selection}
          slots={week.slots}
          bookings={scheduleQuery.data ?? []}
          browserTimeZone={browserTimeZone}
          onOpenChange={(open) => {
            if (!open) setSelection(undefined);
          }}
          onCreated={async () => {
            setSelection(undefined);
            setNotice(messages.successCreated);
            await scheduleQuery.mutate();
          }}
          onConflict={async () => {
            setNotice(messages.errors.conflict);
            await scheduleQuery.mutate();
          }}
        />
      ) : null}

      <BookingDetailsDialog
        locale={locale}
        messages={messages}
        booking={selectedBooking}
        room={selectedRoom}
        now={now}
        browserTimeZone={browserTimeZone}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(undefined);
        }}
        onCancelled={async () => {
          setSelectedBooking(undefined);
          setNotice(messages.successCancelled);
          await scheduleQuery.mutate();
        }}
      />
    </main>
  );
}

function ScheduleToolbar({
  locale,
  messages,
  rooms,
  room,
  week,
  loadingRooms,
  onRoomChange,
  onPrevious,
  onCurrent,
  onNext,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly week: ScheduleWeek;
  readonly loadingRooms: boolean;
  readonly onRoomChange: (roomId: string) => void;
  readonly onPrevious: () => void;
  readonly onCurrent: () => void;
  readonly onNext: () => void;
}) {
  const rangeLabel = `${formatDate(week.visibleDates[0]!, locale, {
    month: 'short',
    day: 'numeric',
  })} – ${formatDate(week.visibleDates[6]!, locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="w-full lg:max-w-sm">
        <Label htmlFor="schedule-room">{messages.roomLabel}</Label>
        <Select
          value={room?.id ?? ''}
          disabled={loadingRooms || rooms.length === 0}
          onValueChange={onRoomChange}
        >
          <SelectTrigger id="schedule-room" className="mt-2">
            <SelectValue placeholder={messages.loadingRooms} />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} · {option.capacity} {messages.roomDetailsLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {room ? (
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5" />
              {messages.roomDetailsLabel} {room.floor}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-3.5" />
              {room.capacity}
            </span>
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={messages.previousWeek}
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" onClick={onCurrent}>
          {messages.currentWeek}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={messages.nextWeek}
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <strong className="ml-1 min-w-44 text-center text-sm">
          {rangeLabel}
        </strong>
      </div>
    </div>
  );
}

function ScheduleGrid({
  locale,
  messages,
  week,
  bookings,
  now,
  browserTimeZone,
  revalidating,
  onSelectSlot,
  onSelectBooking,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly week: ScheduleWeek;
  readonly bookings: readonly ScheduleBooking[];
  readonly now: number;
  readonly browserTimeZone: string;
  readonly revalidating: boolean;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
  readonly onSelectBooking: (booking: ScheduleBooking) => void;
}) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone: browserTimeZone,
        hour: '2-digit',
        minute: '2-digit',
      }),
    [browserTimeZone, locale],
  );
  const daySlots = week.visibleDates.map((date) => {
    const key = formatCalendarDate(date);
    return week.slots.filter(
      (slot) =>
        formatCalendarDate(
          calendarDateAt(slot.startsAtUtc, browserTimeZone),
        ) === key,
    );
  });
  const rowCount = Math.max(...daySlots.map((slots) => slots.length), 1);
  const firstFocusable = week.slots.find(
    (slot) => slot.startsAtUtc > now && !bookingAt(slot.startsAtUtc, bookings),
  )?.id;

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {revalidating ? (
        <div
          className="absolute top-3 right-3 z-30 rounded-full bg-background p-2 shadow"
          role="status"
          aria-label={messages.loadingSchedule}
        >
          <Spinner className="size-4" />
        </div>
      ) : null}
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="min-w-6xl">
          <div className="grid grid-cols-[5rem_repeat(7,minmax(0,1fr))] border-b border-border bg-muted/60">
            <div className="border-r border-border p-3" aria-hidden="true" />
            {week.visibleDates.map((date) => {
              const today =
                formatCalendarDate(calendarDateAt(now, browserTimeZone)) ===
                formatCalendarDate(date);
              return (
                <div
                  key={formatCalendarDate(date)}
                  className="border-r border-border p-3 text-center last:border-r-0"
                >
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {formatDate(date, locale, { weekday: 'short' })}
                  </span>
                  <span
                    className={
                      today
                        ? 'mt-1 inline-grid size-8 place-items-center rounded-full bg-primary font-semibold text-primary-foreground'
                        : 'mt-1 inline-grid size-8 place-items-center font-semibold'
                    }
                    aria-current={today ? 'date' : undefined}
                  >
                    {date.day}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            role="grid"
            aria-label={messages.title}
            className="grid grid-cols-[5rem_repeat(7,minmax(0,1fr))]"
          >
            <div
              className="grid border-r border-border bg-muted/30"
              style={{ gridTemplateRows: `repeat(${rowCount}, 3.25rem)` }}
            >
              {Array.from({ length: rowCount }, (_, index) => (
                <div
                  key={index}
                  className="border-b border-border px-2 pt-1 text-right text-xs text-muted-foreground"
                >
                  {daySlots[0]?.[index]
                    ? formatter.format(daySlots[0][index].startsAtUtc)
                    : null}
                </div>
              ))}
            </div>
            {daySlots.map((slots, dayIndex) => (
              <ScheduleDay
                key={formatCalendarDate(
                  week.visibleDates[dayIndex] as NonNullable<
                    (typeof week.visibleDates)[number]
                  >,
                )}
                slots={slots}
                bookings={bookings}
                rowCount={rowCount}
                now={now}
                messages={messages}
                timeFormatter={formatter}
                firstFocusable={firstFocusable}
                onSelectSlot={onSelectSlot}
                onSelectBooking={onSelectBooking}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleDay({
  slots,
  bookings,
  rowCount,
  now,
  messages,
  timeFormatter,
  firstFocusable,
  onSelectSlot,
  onSelectBooking,
}: {
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly ScheduleBooking[];
  readonly rowCount: number;
  readonly now: number;
  readonly messages: ScheduleMessages;
  readonly timeFormatter: Intl.DateTimeFormat;
  readonly firstFocusable: string | undefined;
  readonly onSelectSlot: (slot: ScheduleSlot) => void;
  readonly onSelectBooking: (booking: ScheduleBooking) => void;
}) {
  const first = slots[0];
  const last = slots.at(-1);
  const bookingStarts = bookings.filter(
    (booking) =>
      first !== undefined &&
      last !== undefined &&
      Date.parse(booking.startsAtUtc) < last.endsAtUtc &&
      Date.parse(booking.endsAtUtc) > first.startsAtUtc,
  );
  const nowPosition =
    first && last && now >= first.startsAtUtc && now < last.endsAtUtc
      ? ((now - first.startsAtUtc) / SLOT_DURATION_MS) * 3.25
      : undefined;

  return (
    <div
      className="relative grid border-r border-border last:border-r-0"
      style={{ gridTemplateRows: `repeat(${rowCount}, 3.25rem)` }}
    >
      {slots.map((slot, index) => {
        const occupied = bookingAt(slot.startsAtUtc, bookings);
        const disabled = slot.startsAtUtc <= now || Boolean(occupied);
        return (
          <button
            key={slot.id}
            type="button"
            role="gridcell"
            tabIndex={slot.id === firstFocusable ? 0 : -1}
            disabled={disabled}
            aria-label={`${timeFormatter.format(slot.startsAtUtc)} – ${
              disabled ? messages.unavailable : messages.available
            }`}
            className="border-b border-border bg-background outline-none transition-colors hover:bg-primary/10 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/25"
            style={{ gridRow: index + 1 }}
            onClick={() => onSelectSlot(slot)}
            onKeyDown={(event) => moveGridFocus(event)}
          />
        );
      })}
      {bookingStarts.map((booking) => {
        const startsAt = Date.parse(booking.startsAtUtc);
        const endsAt = Date.parse(booking.endsAtUtc);
        const matchingRow = slots.findIndex(
          (slot) => startsAt >= slot.startsAtUtc && startsAt < slot.endsAtUtc,
        );
        const row = matchingRow < 0 ? 0 : matchingRow;
        const visibleStart = Math.max(
          startsAt,
          slots[row]?.startsAtUtc ?? startsAt,
        );
        const span = Math.max(
          1,
          Math.min(
            slots.length - row,
            Math.ceil((endsAt - visibleStart) / SLOT_DURATION_MS),
          ),
        );

        return (
          <button
            key={booking.id}
            type="button"
            className={
              booking.isMine
                ? 'z-10 m-1 overflow-hidden rounded-md border border-primary/30 bg-primary px-2 py-1 text-left text-xs text-primary-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                : 'z-10 m-1 overflow-hidden rounded-md border border-border bg-secondary px-2 py-1 text-left text-xs text-secondary-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
            }
            style={{ gridRow: `${row + 1} / span ${span}` }}
            aria-label={`${booking.title}, ${messages.bookedBy} ${booking.author.name}`}
            onClick={() => onSelectBooking(booking)}
          >
            <strong className="block truncate">{booking.title}</strong>
            <span className="mt-0.5 block truncate opacity-80">
              {booking.isMine ? messages.yourBooking : booking.author.name}
            </span>
          </button>
        );
      })}
      {nowPosition !== undefined ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-destructive"
          style={{ top: `${nowPosition}rem` }}
        >
          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-destructive" />
        </div>
      ) : null}
    </div>
  );
}

function CreateBookingDialog({
  locale,
  messages,
  room,
  selection,
  slots,
  bookings,
  browserTimeZone,
  onOpenChange,
  onCreated,
  onConflict,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly room: Room;
  readonly selection: BookingSelection | undefined;
  readonly slots: readonly ScheduleSlot[];
  readonly bookings: readonly ScheduleBooking[];
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCreated: () => Promise<void>;
  readonly onConflict: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [formError, setFormError] = useState<string>();
  const mutation = useSWRMutation(
    ['booking', 'create'],
    (_key, { arg }: { arg: CreateBookingInput }) => createBooking(arg),
  );
  const slot = selection?.slot;
  const endOptions = useMemo(
    () => (slot ? bookingEndOptions(slot, slots, bookings) : []),
    [bookings, slot, slots],
  );

  useEffect(() => {
    if (slot) {
      setTitle('');
      setEndsAt(new Date(slot.endsAtUtc).toISOString());
      setFormError(undefined);
    }
  }, [slot]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!slot || !normalizedTitle) {
      setFormError(messages.requiredTitle);
      return;
    }

    if (!endOptions.some((option) => option === endsAt)) {
      setFormError(messages.invalidEnd);
      return;
    }

    try {
      await mutation.trigger({
        roomId: room.id,
        title: normalizedTitle,
        startsAtUtc: new Date(slot.startsAtUtc).toISOString(),
        endsAtUtc: endsAt,
      });
      await onCreated();
    } catch (error) {
      if (
        error instanceof BookingClientError &&
        error.code === 'BOOKING_CONFLICT'
      ) {
        onOpenChange(false);
        await onConflict();
        return;
      }
      setFormError(errorMessage(error, messages));
    }
  };

  return (
    <Dialog open={Boolean(selection)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.close}>
        <DialogHeader>
          <DialogTitle>{messages.bookingTitle}</DialogTitle>
          <DialogDescription>
            {room.name} ·{' '}
            {selection
              ? formatInstant(
                  selection.slot.startsAtUtc,
                  locale,
                  browserTimeZone,
                )
              : ''}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-2">
            <Label htmlFor="booking-title">{messages.titleLabel}</Label>
            <Input
              id="booking-title"
              autoFocus
              maxLength={100}
              value={title}
              aria-invalid={Boolean(formError)}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="booking-end">{messages.endLabel}</Label>
            <Select value={endsAt} onValueChange={setEndsAt}>
              <SelectTrigger id="booking-end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatInstant(Date.parse(option), locale, browserTimeZone)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {messages.cancel}
            </Button>
            <Button type="submit" disabled={mutation.isMutating}>
              {mutation.isMutating ? messages.creating : messages.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingDetailsDialog({
  locale,
  messages,
  booking,
  room,
  now,
  browserTimeZone,
  onOpenChange,
  onCancelled,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly booking: ScheduleBooking | undefined;
  readonly room: Room | undefined;
  readonly now: number;
  readonly browserTimeZone: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCancelled: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const mutation = useSWRMutation(
    ['booking', 'cancel'],
    (_key, { arg }: { arg: string }) => cancelBooking(arg),
  );
  const canCancel =
    Boolean(booking?.isMine) &&
    booking !== undefined &&
    Date.parse(booking.startsAtUtc) > now;

  useEffect(() => {
    setConfirming(false);
    setError(undefined);
  }, [booking]);

  const confirmCancel = async () => {
    if (!booking) return;

    try {
      await mutation.trigger(booking.id);
      await onCancelled();
    } catch (caught) {
      setError(errorMessage(caught, messages));
    }
  };

  return (
    <Dialog open={Boolean(booking)} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={messages.close}>
        <DialogHeader>
          <DialogTitle>{booking?.title ?? messages.bookingDetails}</DialogTitle>
          <DialogDescription>{messages.bookingDetails}</DialogDescription>
        </DialogHeader>
        {booking ? (
          <dl className="grid gap-4 text-sm">
            <Detail
              label={messages.roomDetailsLabel}
              value={room?.name ?? '—'}
            />
            <Detail
              label={messages.startLabel}
              value={formatInstant(
                Date.parse(booking.startsAtUtc),
                locale,
                browserTimeZone,
              )}
            />
            <Detail
              label={messages.endLabel}
              value={formatInstant(
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
            <CalendarClock aria-hidden="true" />
            <AlertDescription>{messages.cancelConfirmation}</AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
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
                onClick={() => setConfirming(false)}
              >
                {messages.keepBooking}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutation.isMutating}
                onClick={() => void confirmCancel()}
              >
                {mutation.isMutating
                  ? messages.cancelling
                  : messages.cancelBooking}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {messages.close}
              </Button>
              {canCancel ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirming(true)}
                >
                  {messages.cancelBooking}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
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
    <div className="grid gap-1 border-b border-border pb-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function LoadingState({ message }: { readonly message: string }) {
  return (
    <div className="mt-4 flex min-h-80 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm text-muted-foreground">
      <Spinner />
      <span>{message}</span>
    </div>
  );
}

function ErrorState({
  message,
  retry,
  onRetry,
}: {
  readonly message: string;
  readonly retry: string;
  readonly onRetry: () => void;
}) {
  return (
    <Alert variant="destructive" className="mt-4">
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

function EmptyState({ message }: { readonly message: string }) {
  return (
    <div className="mt-4 grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
      {message}
    </div>
  );
}

function bookingAt(
  instant: number,
  bookings: readonly ScheduleBooking[],
): ScheduleBooking | undefined {
  return bookings.find(
    (booking) =>
      Date.parse(booking.startsAtUtc) <= instant &&
      Date.parse(booking.endsAtUtc) > instant,
  );
}

function bookingEndOptions(
  selected: ScheduleSlot,
  slots: readonly ScheduleSlot[],
  bookings: readonly ScheduleBooking[],
): readonly string[] {
  const sameOfficeDay = slots
    .filter(
      (slot) =>
        slot.officeDate === selected.officeDate &&
        slot.startsAtUtc >= selected.startsAtUtc,
    )
    .sort((left, right) => left.startsAtUtc - right.startsAtUtc);
  const options: string[] = [];

  for (const [index, slot] of sameOfficeDay.entries()) {
    if (index >= 8) {
      break;
    }
    if (
      slot.startsAtUtc > selected.startsAtUtc &&
      bookingAt(slot.startsAtUtc, bookings)
    ) {
      break;
    }
    options.push(new Date(slot.endsAtUtc).toISOString());
  }

  return options;
}

function formatDate(
  date: { readonly year: number; readonly month: number; readonly day: number },
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'UTC',
  }).format(Date.UTC(date.year, date.month - 1, date.day));
}

function formatInstant(
  instant: number,
  locale: Locale,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(instant);
}

function isUnauthenticated(error: unknown): boolean {
  return (
    error instanceof BookingClientError &&
    (error.code === 'UNAUTHENTICATED' || error.status === 401)
  );
}

function errorMessage(error: unknown, messages: ScheduleMessages): string {
  if (!(error instanceof BookingClientError)) {
    return messages.errors.generic;
  }

  switch (error.code) {
    case 'BOOKING_CONFLICT':
      return messages.errors.conflict;
    case 'BOOKING_START_NOT_IN_FUTURE':
    case 'BOOKING_NOT_CANCELLABLE':
      return messages.errors.past;
    case 'BOOKING_OUTSIDE_OFFICE_HOURS':
      return messages.errors.outsideHours;
    case 'BOOKING_INVALID_DURATION':
    case 'BOOKING_SLOT_ALIGNMENT':
      return messages.errors.duration;
    case 'BOOKING_TITLE_REQUIRED':
    case 'BOOKING_TITLE_TOO_LONG':
    case 'BOOKING_INVALID_INTERVAL':
    case 'VALIDATION_ERROR':
      return messages.errors.validation;
    case 'BOOKING_CANCELLATION_FORBIDDEN':
      return messages.errors.forbidden;
    case 'BOOKING_NOT_FOUND':
    case 'ROOM_NOT_FOUND':
      return messages.errors.notFound;
    default:
      return messages.errors.generic;
  }
}

function moveGridFocus(event: KeyboardEvent<HTMLButtonElement>): void {
  const direction: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1,
    ArrowRight: 1,
    ArrowLeft: -1,
  };
  const movement = direction[event.key];

  if (!movement) return;
  event.preventDefault();
  const cells = Array.from(
    event.currentTarget
      .closest('[role="grid"]')
      ?.querySelectorAll<HTMLButtonElement>(
        'button[role="gridcell"]:not(:disabled)',
      ) ?? [],
  );
  const index = cells.indexOf(event.currentTarget);
  cells[index + movement]?.focus();
}
