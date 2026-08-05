import { calendarDateAt } from '@mr-booking/shared-date-time';
import { Spinner, cn } from '@mr-booking/shared-ui';
import { useMemo } from 'react';
import { createScheduleViewModel } from '../model/create-schedule-view-model';
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
                className={cn(
                  'border-r border-border p-2 text-center last:border-r-0',
                  selected && 'bg-primary/10',
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
            gridTemplateRows: `repeat(${model.rowCount}, ${model.rowHeightRem}rem)`,
          }}
        >
          {Array.from({ length: model.rowCount }, (_, index) => (
            <div
              key={index}
              className="border-b border-border px-2 pt-1 text-right text-xs tabular-nums text-muted-foreground"
            >
              {model.days[0]?.slots[index]
                ? timeFormatter.format(model.days[0].slots[index].startsAtUtc)
                : null}
            </div>
          ))}
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
            compact={presentation === 'compact'}
            occupiedBySlotId={model.occupiedBySlotId}
            onSelectSlot={onSelectSlot}
            onSelectBooking={onSelectBooking}
          />
        ))}
      </div>
    </div>
  );
}
