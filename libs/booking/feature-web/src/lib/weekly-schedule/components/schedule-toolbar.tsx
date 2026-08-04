import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mr-booking/shared-ui';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Users,
} from 'lucide-react';
import type { Room } from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import {
  type CalendarDate,
  type SchedulePresentation,
  type ScheduleRange,
} from '@mr-booking/booking-ui';
import { formatScheduleWeekRange } from '../formatting/schedule-date-time.formatter';
import { IconButton, ScheduleWeekDateStrip } from './schedule-date-navigation';
import { RoomCapacityFilter } from './room-capacity-filter';
import type {
  ScheduleMessages,
  ScheduleRoomSelectorProps,
} from '../types/schedule-feature.types';

export function ScheduleToolbar({
  locale,
  messages,
  rooms,
  room,
  schedule,
  presentation,
  selectedDate,
  loadingRooms,
  browserTimeZone,
  onRoomChange,
  onPrevious,
  onCurrent,
  onNext,
  onOpenCalendar,
  onSelectDate,
  nowUtc,
  minimumCapacity,
  onApplyCapacity,
  onClearCapacity,
}: {
  readonly locale: Locale;
  readonly messages: ScheduleMessages;
  readonly rooms: readonly Room[];
  readonly room: Room | undefined;
  readonly schedule: ScheduleRange | undefined;
  readonly presentation: SchedulePresentation | undefined;
  readonly selectedDate: CalendarDate;
  readonly loadingRooms: boolean;
  readonly browserTimeZone: string;
  readonly onRoomChange: (roomId: string) => void;
  readonly onPrevious: () => void;
  readonly onCurrent: () => void;
  readonly onNext: () => void;
  readonly onOpenCalendar: () => void;
  readonly onSelectDate: (date: CalendarDate) => void;
  readonly nowUtc: number;
  readonly minimumCapacity: number | undefined;
  readonly onApplyCapacity: (minimumCapacity: number) => void;
  readonly onClearCapacity: () => void;
}) {
  return (
    <>
      {presentation === 'expanded' ? (
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
      ) : null}
      {presentation === 'expanded' && schedule ? (
        <div className="hidden rounded-xl border border-border bg-card p-4 shadow-sm lg:flex lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-4">
            <RoomSelector
              messages={messages}
              rooms={rooms}
              room={room}
              loading={loadingRooms}
              onChange={onRoomChange}
            />
            <RoomCapacityFilter
              messages={messages}
              minimumCapacity={minimumCapacity}
              onApply={onApplyCapacity}
              onClear={onClearCapacity}
            />
          </div>
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
              {formatScheduleWeekRange(schedule.visibleDates, locale)}
            </strong>
          </div>
        </div>
      ) : null}
      {presentation !== 'expanded' ? (
        <div className="grid gap-2 pt-1 lg:hidden">
          <CompactRoomSelector
            messages={messages}
            rooms={rooms}
            room={room}
            loading={loadingRooms}
            onChange={onRoomChange}
          />
          <RoomCapacityFilter
            messages={messages}
            minimumCapacity={minimumCapacity}
            onApply={onApplyCapacity}
            onClear={onClearCapacity}
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
              <span aria-hidden="true">▦</span>
            </IconButton>
          </div>
          <ScheduleWeekDateStrip
            locale={locale}
            messages={messages}
            selectedDate={selectedDate}
            nowUtc={nowUtc}
            browserTimeZone={browserTimeZone}
            onSelect={onSelectDate}
          />
        </div>
      ) : null}
    </>
  );
}

function RoomSelector({
  messages,
  rooms,
  room,
  loading,
  onChange,
}: ScheduleRoomSelectorProps) {
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
}: ScheduleRoomSelectorProps) {
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

function TimeZoneSummary({
  messages,
  browserTimeZone,
}: {
  readonly messages: ScheduleMessages;
  readonly browserTimeZone: string;
}) {
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
