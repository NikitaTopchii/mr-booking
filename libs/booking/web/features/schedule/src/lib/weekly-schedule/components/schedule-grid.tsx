import { calendarDateAt } from '@mr-booking/shared-date-time';
import { Spinner, cn } from '@mr-booking/shared-ui';
import { useMemo } from 'react';
import { createScheduleViewModel } from '../model/create-schedule-view-model';
import { scheduleTimeBoundary } from '../model/schedule-grid-visuals';
import { formatScheduleCalendarDate } from '../formatting/schedule-date-time.formatter';
import type { ScheduleGridProps } from '../types/schedule-grid.types';
import { ScheduleDay } from './schedule-day';

export function ScheduleGrid({
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
  const model = useMemo(
    () =>
      createScheduleViewModel({
        schedule,
        presentation,
        bookings,
        now,
        browserTimeZone,
        locale,
      }),
    [bookings, browserTimeZone, locale, now, presentation, schedule],
  );
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
  const columnTemplate = `4.25rem repeat(${schedule.visibleDates.length}, minmax(0, 1fr))`;
  const todayKey = formatScheduleCalendarDate(
    calendarDateAt(now, browserTimeZone),
    locale,
    { dateStyle: 'short' },
  );
  const currentDay = model.days.find(
    (day) =>
      formatScheduleCalendarDate(day.date, locale, { dateStyle: 'short' }) ===
      todayKey,
  );
  const currentTimeId = `schedule-current-time-${presentation}`;
  return (
    <div
      data-schedule-presentation={presentation}
      aria-busy={revalidating}
      className={cn(
        'relative mt-3 overflow-hidden rounded-sm border border-[var(--schedule-grid-day-border)] bg-card',
        presentation === 'compact' && 'mt-0 flex min-h-0 flex-1 flex-col',
      )}
    >
      {revalidating ? (
        <div
          className="absolute top-3 right-3 z-30 rounded-sm border border-border bg-card p-2"
          role="status"
          aria-label={messages.loadingSchedule}
        >
          <Spinner className="size-4" />
        </div>
      ) : null}
      {presentation !== 'compact' ? (
        <div
          className="grid border-b border-[var(--schedule-grid-day-border)] bg-background"
          style={{ gridTemplateColumns: columnTemplate }}
        >
          <div className="border-r border-border p-2" aria-hidden="true" />
          {schedule.visibleDates.map((date) => {
            const today =
              formatScheduleCalendarDate(date, locale, {
                dateStyle: 'short',
              }) ===
              formatScheduleCalendarDate(
                calendarDateAt(now, browserTimeZone),
                locale,
                { dateStyle: 'short' },
              );
            const selected =
              formatScheduleCalendarDate(selectedDate, locale, {
                dateStyle: 'short',
              }) ===
              formatScheduleCalendarDate(date, locale, { dateStyle: 'short' });
            return (
              <div
                key={formatScheduleCalendarDate(date, locale, {
                  dateStyle: 'short',
                })}
                data-current-day={today || undefined}
                data-selected-day={selected || undefined}
                className={cn(
                  'border-r-2 border-[var(--schedule-grid-day-border)] p-2 text-center last:border-r-0',
                  today && 'bg-[var(--schedule-current-day-header)]',
                  selected && 'ring-1 ring-inset ring-primary/30',
                )}
              >
                <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatScheduleCalendarDate(date, locale, {
                    weekday: 'short',
                  })}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-grid size-8 place-items-center font-semibold',
                    today && 'rounded-sm bg-primary text-primary-foreground',
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
        aria-describedby={currentDay ? currentTimeId : undefined}
        className={cn(
          'grid',
          presentation === 'compact' &&
            'min-h-0 flex-1 overflow-y-auto overscroll-contain [scroll-padding-bottom:var(--mobile-navigation-occupied-space)]',
        )}
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div
          className="sticky left-0 z-20 grid border-r-2 border-[var(--schedule-grid-day-border)] bg-background"
          style={{
            gridTemplateRows: `repeat(${model.rowCount}, ${model.rowHeightRem}rem)`,
          }}
        >
          {Array.from({ length: model.rowCount }, (_, index) =>
            (() => {
              const slot = model.days[0]?.slots[index];
              const boundary = slot
                ? scheduleTimeBoundary(slot.startsAtUtc, timeFormatter)
                : 'half-hour';
              return (
                <div
                  key={index}
                  data-time-axis
                  data-time-boundary={boundary}
                  className={cn(
                    'border-b px-2 pt-1 text-right text-xs tabular-nums text-muted-foreground',
                    boundary === 'hour'
                      ? 'border-[var(--schedule-grid-hour-border)] font-medium'
                      : 'border-[var(--schedule-grid-half-hour-border)]',
                  )}
                >
                  {slot ? timeFormatter.format(slot.startsAtUtc) : null}
                </div>
              );
            })(),
          )}
        </div>
        {model.days.map((day, dayIndex) => (
          <ScheduleDay
            key={formatScheduleCalendarDate(day.date, locale, {
              dateStyle: 'short',
            })}
            locale={locale}
            day={day}
            dayIndex={dayIndex}
            rowCount={model.rowCount}
            rowHeightRem={model.rowHeightRem}
            messages={messages}
            timeFormatter={timeFormatter}
            firstFocusable={model.firstFocusable}
            currentDay={
              formatScheduleCalendarDate(day.date, locale, {
                dateStyle: 'short',
              }) === todayKey
            }
            occupiedBySlotId={model.occupiedBySlotId}
            onSelectSlot={onSelectSlot}
            onSelectBooking={onSelectBooking}
          />
        ))}
      </div>
      {currentDay ? (
        <p id={currentTimeId} className="sr-only">
          {messages.accessibility.currentTime}:{' '}
          {timeFormatter.format(currentDay.nowUtc)}
        </p>
      ) : null}
    </div>
  );
}
