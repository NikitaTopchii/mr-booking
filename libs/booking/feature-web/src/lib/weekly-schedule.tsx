'use client';

import {
  BookingClientError,
  bookingKeys,
  cancelBooking,
  createBooking,
  listRoomBookings,
  listRooms,
  type ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import {
  OFFICE_TIME_ZONE,
  addCalendarDays,
  calendarDateAt,
  createPresentationRange,
  createScheduleSearchParams,
  currentTimePosition,
  formatCalendarDate,
  selectedDateFromUrl,
  startOfCalendarWeek,
  type CalendarDate,
  type ScheduleSlot,
} from '@mr-booking/booking-ui';
import type { Locale } from '@mr-booking/shared-i18n';
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
  cn,
} from '@mr-booking/shared-ui';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
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
import type {
  BookingDetailsDialogProps,
  BookingSelection,
  CancelBookingMutationOptions,
  CompactContextProps,
  CreateBookingDialogProps,
  CreateBookingMutationOptions,
  DetailProps,
  ExpandedToolbarProps,
  IconButtonProps,
  RoomSelectorProps,
  ScheduleDatePickerProps,
  ScheduleDayProps,
  ScheduleEmptyStateProps,
  ScheduleErrorStateProps,
  ScheduleGridProps,
  ScheduleLoadingProps,
  ScheduleMessages,
  SelectedDayHeadingProps,
  TimeZoneSummaryProps,
  WeeklyScheduleProps,
  WeekDateStripProps,
} from './types/weekly-schedule.types';
import { useBrowserTimeZone } from './use-browser-time-zone';
import { useSchedulePresentation } from './use-schedule-presentation';

export function WeeklySchedule({ locale, messages }: WeeklyScheduleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browserTimeZone = useBrowserTimeZone();
  const presentation = useSchedulePresentation();
  const [now, setNow] = useState(() => Date.now());
  const [selection, setSelection] = useState<BookingSelection>();
  const [selectedBooking, setSelectedBooking] = useState<ScheduleBooking>();
  const [notice, setNotice] = useState<string>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = useMemo(
    () =>
      selectedDateFromUrl(
        searchParams.get('date'),
        searchParams.get('week'),
        now,
        browserTimeZone,
      ),
    [browserTimeZone, now, searchParams],
  );
  const selectedDateKey = formatCalendarDate(selectedDate);
  const schedule = useMemo(
    () =>
      presentation
        ? createPresentationRange(selectedDate, presentation, browserTimeZone)
        : undefined,
    [browserTimeZone, presentation, selectedDate],
  );
  const requestedRoomId = searchParams.get('roomId') ?? '';

  const roomsQuery = useSWR(bookingKeys.rooms(), listRooms, {
    revalidateOnFocus: false,
  });
  const rooms = roomsQuery.data ?? [];
  const selectedRoom =
    rooms.find(({ id }) => id === requestedRoomId) ?? rooms[0];
  const scheduleQuery = useSWR(
    selectedRoom && schedule
      ? bookingKeys.schedule(selectedRoom.id, schedule.range)
      : null,
    () =>
      listRoomBookings(selectedRoom?.id ?? '', schedule?.range ?? emptyRange),
    { keepPreviousData: false },
  );

  const navigate = useCallback(
    (date: CalendarDate, roomId = selectedRoom?.id, replace = false) => {
      const query = createScheduleSearchParams(searchParams, {
        date: formatCalendarDate(date),
        ...(roomId ? { roomId } : {}),
      });
      const href = `?${query.toString()}`;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router, searchParams, selectedRoom?.id],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const expectedWeek = formatCalendarDate(startOfCalendarWeek(selectedDate));
    if (
      searchParams.get('date') !== selectedDateKey ||
      searchParams.get('week') !== expectedWeek
    ) {
      navigate(selectedDate, selectedRoom?.id, true);
    }
  }, [navigate, searchParams, selectedDate, selectedDateKey, selectedRoom?.id]);

  useEffect(() => {
    if (selectedRoom && requestedRoomId !== selectedRoom.id) {
      navigate(selectedDate, selectedRoom.id, true);
    }
  }, [navigate, requestedRoomId, selectedDate, selectedRoom]);

  useEffect(() => {
    const error = roomsQuery.error ?? scheduleQuery.error;
    if (isUnauthenticated(error)) router.replace(`/${locale}/login`);
  }, [locale, roomsQuery.error, router, scheduleQuery.error]);

  const selectDate = (date: CalendarDate) => {
    setNotice(undefined);
    navigate(date);
  };

  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-screen-2xl overflow-x-clip px-3 py-4 sm:px-6 sm:py-6 lg:py-8"
    >
      <div className="hidden border-b border-border pb-6 lg:flex lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {messages.title}
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            {messages.description}
          </p>
        </div>
        <TimeZoneSummary
          messages={messages}
          browserTimeZone={browserTimeZone}
        />
      </div>

      <section aria-label={messages.title} className="lg:py-5">
        <div className="sticky top-[4.5rem] z-30 -mx-3 border-b border-border bg-background/95 px-3 pb-3 backdrop-blur-sm sm:top-[4.5rem] sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:backdrop-blur-none">
          {presentation === 'expanded' && schedule ? (
            <ExpandedToolbar
              locale={locale}
              messages={messages}
              rooms={rooms}
              room={selectedRoom}
              schedule={schedule}
              loadingRooms={roomsQuery.isLoading}
              onRoomChange={(roomId) => navigate(selectedDate, roomId)}
              onPrevious={() => selectDate(addCalendarDays(selectedDate, -7))}
              onCurrent={() =>
                selectDate(calendarDateAt(Date.now(), browserTimeZone))
              }
              onNext={() => selectDate(addCalendarDays(selectedDate, 7))}
            />
          ) : (
            <CompactContext
              locale={locale}
              messages={messages}
              rooms={rooms}
              room={selectedRoom}
              selectedDate={selectedDate}
              now={now}
              browserTimeZone={browserTimeZone}
              loadingRooms={roomsQuery.isLoading}
              onRoomChange={(roomId) => navigate(selectedDate, roomId)}
              onPrevious={() => selectDate(addCalendarDays(selectedDate, -7))}
              onCurrent={() =>
                selectDate(calendarDateAt(Date.now(), browserTimeZone))
              }
              onNext={() => selectDate(addCalendarDays(selectedDate, 7))}
              onOpenCalendar={() => setCalendarOpen(true)}
              onSelectDate={selectDate}
            />
          )}
        </div>

        {notice ? (
          <p
            role="status"
            className="mt-3 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
          >
            {notice}
          </p>
        ) : null}

        {roomsQuery.isLoading || !presentation ? (
          <ScheduleLoading
            presentation={presentation}
            message={
              roomsQuery.isLoading
                ? messages.loadingRooms
                : messages.loadingSchedule
            }
          />
        ) : roomsQuery.error ? (
          <ErrorState
            message={messages.errors.rooms}
            retry={messages.retry}
            onRetry={() => void roomsQuery.mutate()}
          />
        ) : rooms.length === 0 ? (
          <EmptyState message={messages.emptyRooms} />
        ) : scheduleQuery.error ? (
          <ErrorState
            message={messages.errors.schedule}
            retry={messages.retry}
            onRetry={() => void scheduleQuery.mutate()}
          />
        ) : scheduleQuery.isLoading || !schedule ? (
          <ScheduleLoading
            presentation={presentation}
            message={messages.loadingSchedule}
          />
        ) : selectedRoom ? (
          <>
            {presentation !== 'expanded' ? (
              <SelectedDayHeading
                locale={locale}
                messages={messages}
                selectedDate={selectedDate}
                browserTimeZone={browserTimeZone}
              />
            ) : null}
            {scheduleQuery.data?.length === 0 && presentation === 'compact' ? (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                {messages.mobile.noBookingsForDay}
              </p>
            ) : null}
            <ScheduleGrid
              locale={locale}
              messages={messages}
              schedule={schedule}
              presentation={presentation}
              bookings={scheduleQuery.data ?? []}
              now={now}
              browserTimeZone={browserTimeZone}
              revalidating={scheduleQuery.isValidating}
              selectedDate={selectedDate}
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

      <ScheduleDatePicker
        locale={locale}
        messages={messages}
        open={calendarOpen}
        selectedDate={selectedDate}
        now={now}
        browserTimeZone={browserTimeZone}
        onOpenChange={setCalendarOpen}
        onSelect={(date) => {
          setCalendarOpen(false);
          selectDate(date);
        }}
      />

      {selectedRoom && schedule ? (
        <CreateBookingDialog
          locale={locale}
          messages={messages}
          room={selectedRoom}
          selection={selection}
          slots={schedule.slots}
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

const emptyRange = { fromUtc: '', toUtc: '' };

function RoomSelector({
  messages,
  rooms,
  room,
  loading,
  onChange,
}: RoomSelectorProps) {
  return (
    <div className="w-full lg:max-w-sm">
      <Label htmlFor="schedule-room">{messages.roomLabel}</Label>
      <Select
        value={room?.id ?? ''}
        disabled={loading || rooms.length === 0}
        onValueChange={onChange}
      >
        <SelectTrigger
          id="schedule-room"
          aria-label={messages.mobile.selectRoom}
          className="mt-2"
        >
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
  );
}

function CompactRoomSelector({
  messages,
  rooms,
  room,
  loading,
  onChange,
}: RoomSelectorProps) {
  const statusLabel = room
    ? `${messages.mobile.selectedRoom}: ${room.name}`
    : messages.loadingRooms;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-stretch gap-2">
      <div
        role="status"
        aria-label={statusLabel}
        className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Check aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[0.6875rem] font-medium text-muted-foreground">
            {messages.mobile.selectedRoom}
          </span>
          {room ? (
            <>
              <strong className="block truncate text-sm font-semibold">
                {room.name}
              </strong>
              <span className="block truncate text-xs text-muted-foreground">
                {messages.mobile.floor} {room.floor} · {room.capacity}{' '}
                {messages.mobile.capacity}
              </span>
            </>
          ) : (
            <span className="block truncate text-sm">
              {messages.loadingRooms}
            </span>
          )}
        </span>
      </div>
      <div className="self-center">
        <Label htmlFor="schedule-room-compact" className="sr-only">
          {messages.roomLabel}
        </Label>
        <Select
          value={room?.id ?? ''}
          disabled={loading || rooms.length === 0}
          onValueChange={onChange}
        >
          <SelectTrigger
            id="schedule-room-compact"
            aria-label={messages.mobile.selectRoom}
            className="w-auto touch-manipulation px-3"
          >
            <Building2 aria-hidden="true" className="size-4" />
            <span>{messages.mobile.changeRoom}</span>
          </SelectTrigger>
          <SelectContent align="end">
            {rooms.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} · {messages.mobile.floor} {option.floor} ·{' '}
                {option.capacity} {messages.mobile.capacity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ExpandedToolbar({
  locale,
  messages,
  rooms,
  room,
  schedule,
  loadingRooms,
  onRoomChange,
  onPrevious,
  onCurrent,
  onNext,
}: ExpandedToolbarProps) {
  const rangeLabel = `${formatDate(
    requiredDate(schedule.visibleDates, 0),
    locale,
    {
      month: 'short',
      day: 'numeric',
    },
  )} – ${formatDate(requiredDate(schedule.visibleDates, 6), locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <RoomSelector
        messages={messages}
        rooms={rooms}
        room={room}
        loading={loadingRooms}
        onChange={onRoomChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label={messages.previousWeek} onClick={onPrevious}>
          <ChevronLeft aria-hidden="true" />
        </IconButton>
        <Button type="button" variant="outline" onClick={onCurrent}>
          {messages.currentWeek}
        </Button>
        <IconButton label={messages.nextWeek} onClick={onNext}>
          <ChevronRight aria-hidden="true" />
        </IconButton>
        <strong className="ml-1 min-w-44 text-center text-sm">
          {rangeLabel}
        </strong>
      </div>
    </div>
  );
}

function CompactContext({
  locale,
  messages,
  rooms,
  room,
  selectedDate,
  now,
  browserTimeZone,
  loadingRooms,
  onRoomChange,
  onPrevious,
  onCurrent,
  onNext,
  onOpenCalendar,
  onSelectDate,
}: CompactContextProps) {
  return (
    <div className="grid gap-2 pt-1">
      <CompactRoomSelector
        messages={messages}
        rooms={rooms}
        room={room}
        loading={loadingRooms}
        onChange={onRoomChange}
      />
      <div className="flex items-center gap-2">
        <IconButton label={messages.previousWeek} onClick={onPrevious}>
          <ChevronLeft aria-hidden="true" />
        </IconButton>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 px-3"
          onClick={onCurrent}
        >
          {messages.mobile.today}
        </Button>
        <IconButton label={messages.nextWeek} onClick={onNext}>
          <ChevronRight aria-hidden="true" />
        </IconButton>
        <IconButton
          label={messages.mobile.openCalendar}
          onClick={onOpenCalendar}
        >
          <CalendarDays aria-hidden="true" />
        </IconButton>
      </div>
      <WeekDateStrip
        locale={locale}
        messages={messages}
        selectedDate={selectedDate}
        now={now}
        browserTimeZone={browserTimeZone}
        onSelect={onSelectDate}
      />
    </div>
  );
}

function WeekDateStrip({
  locale,
  messages,
  selectedDate,
  now,
  browserTimeZone,
  onSelect,
}: WeekDateStripProps) {
  const weekStart = startOfCalendarWeek(selectedDate);
  const selectedKey = formatCalendarDate(selectedDate);
  const todayKey = formatCalendarDate(calendarDateAt(now, browserTimeZone));
  return (
    <div
      role="group"
      aria-label={messages.mobile.selectedDate}
      className="grid grid-cols-7 gap-1"
    >
      {Array.from({ length: 7 }, (_, index) => {
        const date = addCalendarDays(weekStart, index);
        const key = formatCalendarDate(date);
        const selected = key === selectedKey;
        const today = key === todayKey;
        const completeLabel = `${messages.accessibility.selectDay} ${formatDate(
          date,
          locale,
          { dateStyle: 'full' },
        )}${selected ? `, ${messages.accessibility.selectedDay}` : ''}${
          today ? `, ${messages.accessibility.currentDay}` : ''
        }`;
        return (
          <button
            key={key}
            type="button"
            aria-label={completeLabel}
            aria-pressed={selected}
            aria-current={today ? 'date' : undefined}
            className={cn(
              'min-h-14 touch-manipulation rounded-lg border px-0.5 py-1 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-transparent bg-card text-foreground hover:bg-accent',
              today && !selected && 'border-primary font-semibold',
            )}
            onClick={() => onSelect(date)}
          >
            <span className="block text-[0.65rem] font-medium uppercase">
              {formatDate(date, locale, { weekday: 'short' })}
            </span>
            <span className="mt-0.5 block text-sm font-semibold">
              {date.day}
            </span>
            {today ? (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-auto mt-0.5 block size-1 rounded-full',
                  selected ? 'bg-primary-foreground' : 'bg-primary',
                )}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function SelectedDayHeading({
  locale,
  messages,
  selectedDate,
  browserTimeZone,
}: SelectedDayHeadingProps) {
  return (
    <div className="mt-4">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {formatDate(selectedDate, locale, { dateStyle: 'full' })}
      </h1>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {messages.mobile.browserTimezone}: {browserTimeZone}
        </span>
        {browserTimeZone !== OFFICE_TIME_ZONE ? (
          <span>
            {messages.mobile.officeTimezone}: 09:00–19:00 {OFFICE_TIME_ZONE}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TimeZoneSummary({ messages, browserTimeZone }: TimeZoneSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <Clock3 aria-hidden="true" className="size-4" />
        {messages.officeHours}
      </span>
      <span>
        {messages.localTime}: {browserTimeZone}
      </span>
    </div>
  );
}

function ScheduleGrid({
  locale,
  messages,
  schedule,
  presentation,
  bookings,
  now,
  browserTimeZone,
  revalidating,
  selectedDate,
  onSelectSlot,
  onSelectBooking,
}: ScheduleGridProps) {
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        timeZone: browserTimeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [browserTimeZone, locale],
  );
  const daySlots = schedule.visibleDates.map((date) => {
    const key = formatCalendarDate(date);
    return schedule.slots.filter(
      (slot) =>
        formatCalendarDate(
          calendarDateAt(slot.startsAtUtc, browserTimeZone),
        ) === key,
    );
  });
  const rowCount = Math.max(...daySlots.map((slots) => slots.length), 1);
  const rowHeightRem = presentation === 'compact' ? 4.25 : 3.5;
  const firstFocusable = schedule.slots.find(
    (slot) => slot.startsAtUtc > now && !bookingAt(slot.startsAtUtc, bookings),
  )?.id;
  const columnTemplate = `4.25rem repeat(${schedule.visibleDates.length}, minmax(0, 1fr))`;

  return (
    <div
      data-schedule-presentation={presentation}
      aria-busy={revalidating}
      className="relative mt-3 overflow-hidden rounded-xl border border-border bg-muted/20 shadow-sm"
    >
      {revalidating ? (
        <div
          className="absolute top-3 right-3 z-30 rounded-full bg-background p-2 shadow"
          role="status"
          aria-label={messages.loadingSchedule}
        >
          <Spinner className="size-4" />
        </div>
      ) : null}
      {presentation !== 'compact' ? (
        <div
          className="grid border-b border-border bg-muted/60"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div className="border-r border-border p-2" aria-hidden="true" />
          {schedule.visibleDates.map((date) => {
            const today =
              formatCalendarDate(calendarDateAt(now, browserTimeZone)) ===
              formatCalendarDate(date);
            const selected =
              formatCalendarDate(selectedDate) === formatCalendarDate(date);
            return (
              <div
                key={formatCalendarDate(date)}
                className={cn(
                  'border-r border-border p-2 text-center last:border-r-0',
                  selected && 'bg-primary/10',
                )}
              >
                <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatDate(date, locale, { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-grid size-8 place-items-center font-semibold',
                    today && 'rounded-full bg-primary text-primary-foreground',
                  )}
                  aria-current={today ? 'date' : undefined}
                >
                  {date.day}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      <div
        role="grid"
        aria-label={messages.title}
        className="grid"
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div
          className="sticky left-0 z-20 grid border-r border-border bg-muted/40"
          style={{
            gridTemplateRows: `repeat(${rowCount}, ${rowHeightRem}rem)`,
          }}
        >
          {Array.from({ length: rowCount }, (_, index) => (
            <div
              key={index}
              className="border-b border-border px-2 pt-1 text-right text-xs tabular-nums text-muted-foreground"
            >
              {daySlots[0]?.[index]
                ? timeFormatter.format(daySlots[0][index].startsAtUtc)
                : null}
            </div>
          ))}
        </div>
        {daySlots.map((slots, dayIndex) => {
          const date = requiredDate(schedule.visibleDates, dayIndex);
          return (
            <ScheduleDay
              key={formatCalendarDate(date)}
              locale={locale}
              date={date}
              browserTimeZone={browserTimeZone}
              slots={slots}
              bookings={bookings}
              rowCount={rowCount}
              rowHeightRem={rowHeightRem}
              now={now}
              messages={messages}
              timeFormatter={timeFormatter}
              firstFocusable={firstFocusable}
              compact={presentation === 'compact'}
              onSelectSlot={onSelectSlot}
              onSelectBooking={onSelectBooking}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScheduleDay({
  locale,
  date,
  browserTimeZone,
  slots,
  bookings,
  rowCount,
  rowHeightRem,
  now,
  messages,
  timeFormatter,
  firstFocusable,
  compact,
  onSelectSlot,
  onSelectBooking,
}: ScheduleDayProps) {
  const first = slots[0];
  const last = slots.at(-1);
  const visibleBookings = bookings.filter(
    (booking) =>
      first !== undefined &&
      last !== undefined &&
      Date.parse(booking.startsAtUtc) < last.endsAtUtc &&
      Date.parse(booking.endsAtUtc) > first.startsAtUtc,
  );
  const nowSlotPosition = currentTimePosition(now, first, last);
  const nowPosition =
    nowSlotPosition === undefined ? undefined : nowSlotPosition * rowHeightRem;
  return (
    <div
      className="relative grid border-r border-border last:border-r-0"
      style={{
        gridTemplateRows: `repeat(${rowCount}, ${rowHeightRem}rem)`,
      }}
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
            aria-label={`${formatDate(date, locale, {
              dateStyle: 'full',
            })}, ${timeFormatter.format(slot.startsAtUtc)} – ${
              disabled ? messages.unavailable : messages.available
            }`}
            className="touch-manipulation border-b border-border bg-transparent outline-none transition-colors hover:bg-primary/10 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/40"
            style={{ gridColumn: 1, gridRow: index + 1 }}
            onClick={() => onSelectSlot(slot)}
            onKeyDown={moveGridFocus}
          />
        );
      })}
      {visibleBookings.map((booking) => {
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
            Math.ceil((endsAt - visibleStart) / BOOKING_SLOT_MILLISECONDS),
          ),
        );
        const timeRange = formatTimeRange(
          startsAt,
          endsAt,
          locale,
          browserTimeZone,
        );
        const ownership = booking.isMine
          ? messages.yourBooking
          : booking.author.name;
        return (
          <button
            key={booking.id}
            type="button"
            className={cn(
              'z-10 m-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              booking.isMine
                ? 'border-primary/40 bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-secondary-foreground',
            )}
            style={{
              gridColumn: 1,
              gridRow: `${row + 1} / span ${span}`,
            }}
            aria-label={`${messages.accessibility.bookingAtTime}: ${
              booking.title
            }, ${formatDate(date, locale, {
              dateStyle: 'full',
            })}, ${timeRange}, ${ownership}`}
            onClick={() => onSelectBooking(booking)}
          >
            <strong className="block truncate">{booking.title}</strong>
            <span className="mt-0.5 block truncate tabular-nums opacity-90">
              {timeRange}
            </span>
            {compact || span > 1 ? (
              <span className="mt-0.5 flex items-center gap-1 truncate opacity-90">
                {booking.isMine ? (
                  <Check aria-hidden="true" className="size-3 shrink-0" />
                ) : null}
                <span className="truncate">{ownership}</span>
              </span>
            ) : null}
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

function ScheduleDatePicker({
  locale,
  messages,
  open,
  selectedDate,
  now,
  browserTimeZone,
  onOpenChange,
  onSelect,
}: ScheduleDatePickerProps) {
  const [visibleMonth, setVisibleMonth] = useState({
    year: selectedDate.year,
    month: selectedDate.month,
    day: 1,
  });
  useEffect(() => {
    if (open) {
      setVisibleMonth({
        year: selectedDate.year,
        month: selectedDate.month,
        day: 1,
      });
    }
  }, [open, selectedDate]);
  const monthStart = startOfCalendarWeek(visibleMonth);
  const todayKey = formatCalendarDate(calendarDateAt(now, browserTimeZone));
  const selectedKey = formatCalendarDate(selectedDate);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={messages.close}
        className="max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[85dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <DialogHeader>
          <DialogTitle>{messages.mobile.openCalendar}</DialogTitle>
          <DialogDescription>
            {formatDate(visibleMonth, locale, {
              month: 'long',
              year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <IconButton
            label={messages.mobile.previousMonth}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </IconButton>
          <strong>
            {formatDate(visibleMonth, locale, {
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          <IconButton
            label={messages.mobile.nextMonth}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </IconButton>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="py-2">
              {formatDate(addCalendarDays(monthStart, index), locale, {
                weekday: 'short',
              })}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }, (_, index) => {
            const date = addCalendarDays(monthStart, index);
            const key = formatCalendarDate(date);
            const inMonth = date.month === visibleMonth.month;
            return (
              <button
                key={key}
                type="button"
                aria-label={formatDate(date, locale, { dateStyle: 'full' })}
                aria-pressed={key === selectedKey}
                aria-current={key === todayKey ? 'date' : undefined}
                className={cn(
                  'min-h-11 rounded-md text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                  !inMonth && 'text-muted-foreground',
                  key === todayKey && 'border border-primary font-semibold',
                  key === selectedKey &&
                    'bg-primary text-primary-foreground hover:bg-primary',
                )}
                onClick={() => onSelect(date)}
              >
                {date.day}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
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
}: CreateBookingDialogProps) {
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [formError, setFormError] = useState<string>();
  const mutation = useSWRMutation(
    ['booking', 'create'],
    (_key, { arg }: CreateBookingMutationOptions) => createBooking(arg),
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
    if (!endOptions.includes(endsAt)) {
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
  const quickDurations = [
    [1, messages.duration.thirtyMinutes],
    [2, messages.duration.oneHour],
    [3, messages.duration.ninetyMinutes],
    [4, messages.duration.twoHours],
  ] as const;
  return (
    <Dialog open={Boolean(selection)} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={messages.close}
        className="max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <DialogHeader>
          <DialogTitle>{messages.bookingTitle}</DialogTitle>
          <DialogDescription>
            {room.name} ·{' '}
            {slot
              ? formatInstant(slot.startsAtUtc, locale, browserTimeZone)
              : ''}
          </DialogDescription>
        </DialogHeader>
        {slot ? (
          <div className="grid gap-1 rounded-lg bg-muted p-3 text-sm">
            <span>
              {messages.mobile.browserTimezone}:{' '}
              {formatTimeRange(
                slot.startsAtUtc,
                endsAt ? Date.parse(endsAt) : slot.endsAtUtc,
                locale,
                browserTimeZone,
              )}
            </span>
            {browserTimeZone !== OFFICE_TIME_ZONE ? (
              <span>
                {messages.mobile.officeInterval}:{' '}
                {formatTimeRange(
                  slot.startsAtUtc,
                  endsAt ? Date.parse(endsAt) : slot.endsAtUtc,
                  locale,
                  OFFICE_TIME_ZONE,
                )}
              </span>
            ) : null}
          </div>
        ) : null}
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
                const valid = endOptions.includes(value);
                return (
                  <Button
                    key={slotCount}
                    type="button"
                    size="sm"
                    variant={endsAt === value ? 'default' : 'outline'}
                    disabled={!valid}
                    onClick={() => setEndsAt(value)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid gap-2">
            <Label htmlFor="booking-end">{messages.duration.custom}</Label>
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
            <Alert variant="destructive" role="alert">
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
}: BookingDetailsDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const mutation = useSWRMutation(
    ['booking', 'cancel'],
    (_key, { arg }: CancelBookingMutationOptions) => cancelBooking(arg),
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
      <DialogContent
        closeLabel={messages.close}
        className="max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-h-[90dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <DialogHeader>
          <DialogTitle>{booking?.title ?? messages.bookingDetails}</DialogTitle>
          <DialogDescription>
            {booking?.isMine ? messages.yourBooking : messages.bookingDetails}
          </DialogDescription>
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

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="min-h-11 min-w-11 shrink-0 touch-manipulation"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Detail({ label, value }: DetailProps) {
  return (
    <div className="grid gap-1 border-b border-border pb-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ScheduleLoading({ presentation, message }: ScheduleLoadingProps) {
  const columns =
    presentation === 'expanded' ? 7 : presentation === 'medium' ? 3 : 1;
  return (
    <div
      className="mt-4 rounded-xl border border-border bg-card p-4"
      role="status"
      aria-label={message}
    >
      <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner />
        <span>{message}</span>
      </div>
      <div
        data-loading-columns={columns}
        className="grid min-h-80 animate-pulse gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, retry, onRetry }: ScheduleErrorStateProps) {
  return (
    <Alert variant="destructive" className="mt-4" role="alert">
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

function EmptyState({ message }: ScheduleEmptyStateProps) {
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
    if (index >= 8) break;
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

function addMonths(date: CalendarDate, amount: number): CalendarDate {
  const result = new Date(Date.UTC(date.year, date.month - 1 + amount, 1));
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: 1,
  };
}

function formatDate(
  date: CalendarDate,
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

function formatTimeRange(
  start: number,
  end: number,
  locale: Locale,
  timeZone: string,
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

function requiredDate(
  dates: readonly CalendarDate[],
  index: number,
): CalendarDate {
  const date = dates[index];
  if (!date) throw new Error('MISSING_VISIBLE_DATE');
  return date;
}

function isUnauthenticated(error: unknown): boolean {
  return (
    error instanceof BookingClientError &&
    (error.code === 'UNAUTHENTICATED' || error.status === 401)
  );
}

function errorMessage(error: unknown, messages: ScheduleMessages): string {
  if (!(error instanceof BookingClientError)) return messages.errors.generic;
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
  const movement: Record<string, number> = {
    ArrowDown: 1,
    ArrowUp: -1,
    ArrowRight: 1,
    ArrowLeft: -1,
  };
  const direction = movement[event.key];
  if (!direction) return;
  event.preventDefault();
  const cells = Array.from(
    event.currentTarget
      .closest('[role="grid"]')
      ?.querySelectorAll<HTMLButtonElement>(
        'button[role="gridcell"]:not(:disabled)',
      ) ?? [],
  );
  const index = cells.indexOf(event.currentTarget);
  cells[index + direction]?.focus();
}
