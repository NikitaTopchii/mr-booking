import { Button } from '@mr-booking/shared-ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Room } from '@mr-booking/booking-data-access-web';
import type { CalendarDate } from '@mr-booking/shared-date-time';
import type { Locale } from '@mr-booking/shared-i18n';
import { formatScheduleWeekRange } from '../formatting/schedule-date-time.formatter';
import { IconButton, ScheduleWeekDateStrip } from './schedule-date-navigation';
import { RoomCapacityFilter } from './room-capacity-filter';
import { MobileScheduleControlDock } from './mobile-schedule-control-dock';
import { ScheduleRoomSelector } from './schedule-room-selector';
import { ScheduleTimeZoneSummary } from './schedule-time-zone-summary';
import type { ScheduleMessages } from '../types/schedule-feature.types';
import type {
  SchedulePresentation,
  ScheduleRange,
} from '../types/schedule.types';

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
  loadingSchedule,
  hasScheduleError,
  noMatchingRooms,
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
  readonly loadingSchedule: boolean;
  readonly hasScheduleError: boolean;
  readonly noMatchingRooms: boolean;
}) {
  return (
    <>
      <div
        data-schedule-heading
        className="hidden items-center justify-between gap-4 border-b border-border pb-3 lg:flex"
      >
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          {messages.title}
        </h1>
        <ScheduleTimeZoneSummary
          messages={messages}
          browserTimeZone={browserTimeZone}
          compact={presentation !== 'expanded'}
          className="mb-0.5 shrink-0"
        />
      </div>
      {presentation === 'expanded' && schedule ? (
        <div
          data-schedule-toolbar="expanded"
          className="hidden border-b border-border py-4 lg:flex lg:flex-wrap lg:items-start lg:justify-between lg:gap-x-6 lg:gap-y-3"
        >
          <div className="grid min-w-0 items-start gap-4 lg:w-[36rem] lg:grid-cols-[16rem_minmax(0,1fr)] xl:w-[38rem]">
            <ScheduleRoomSelector
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
          <div
            role="group"
            aria-label={messages.currentWeek}
            data-schedule-week-navigation
            className="mt-5 flex flex-wrap items-center gap-2"
          >
            <IconButton label={messages.previousWeek} onClick={onPrevious}>
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={onCurrent}
            >
              {messages.currentWeek}
            </Button>
            <IconButton label={messages.nextWeek} onClick={onNext}>
              <ChevronRight aria-hidden="true" />
            </IconButton>
            <strong className="min-w-44 text-center text-sm tabular-nums">
              {formatScheduleWeekRange(schedule.visibleDates, locale)}
            </strong>
          </div>
        </div>
      ) : null}
      {presentation !== 'expanded' ? (
        <div data-schedule-toolbar="compact" className="grid lg:hidden">
          {presentation === 'compact' ? (
            <MobileScheduleControlDock
              messages={messages}
              rooms={rooms}
              room={room}
              loading={loadingRooms}
              onChange={onRoomChange}
              browserTimeZone={browserTimeZone}
              minimumCapacity={minimumCapacity}
              loadingSchedule={loadingSchedule}
              hasScheduleError={hasScheduleError}
              noMatchingRooms={noMatchingRooms}
              onApplyCapacity={onApplyCapacity}
              onClearCapacity={onClearCapacity}
            />
          ) : null}
          {presentation === 'medium' ? (
            <div className="grid grid-cols-[minmax(16rem,18rem)_minmax(18rem,1fr)] items-end gap-4 border-b border-border py-3">
              <ScheduleRoomSelector
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
          ) : null}
          <div className="grid gap-2 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div
              role="group"
              aria-label={messages.currentWeek}
              data-schedule-week-navigation
              className="flex items-center gap-2"
            >
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
              {schedule ? (
                <strong className="ml-auto hidden text-right text-sm tabular-nums md:block">
                  {formatScheduleWeekRange(schedule.visibleDates, locale)}
                </strong>
              ) : null}
            </div>
            <div className="md:hidden">
              <ScheduleWeekDateStrip
                locale={locale}
                messages={messages}
                selectedDate={selectedDate}
                nowUtc={nowUtc}
                browserTimeZone={browserTimeZone}
                onSelect={onSelectDate}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
