import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import { cn } from '@mr-booking/shared-ui';
import { Check, UserRound } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import {
  findGridTarget,
  type GridCellCoordinate,
} from '../model/schedule-grid-navigation';
import { scheduleTimeBoundary } from '../model/schedule-grid-visuals';
import {
  bookingAuthorColor,
  bookingAuthorForeground,
} from '../model/booking-author-color';
import { formatScheduleCalendarDate } from '../formatting/schedule-date-time.formatter';
import type { ScheduleDayProps } from '../types/schedule-grid.types';

export function ScheduleDay({
  locale,
  day,
  dayIndex,
  rowCount,
  rowHeightRem,
  messages,
  timeFormatter,
  firstFocusable,
  currentDay,
  occupiedBySlotId,
  onSelectSlot,
  onSelectBooking,
}: ScheduleDayProps) {
  return (
    <div
      data-current-day={currentDay || undefined}
      className={cn(
        'relative grid border-r-2 border-[var(--schedule-grid-day-border)] last:border-r-0',
        currentDay && 'bg-[var(--schedule-current-day-surface)]',
      )}
      style={{ gridTemplateRows: `repeat(${rowCount}, ${rowHeightRem}rem)` }}
    >
      {day.slots.map((slot, row) => {
        const occupied = occupiedBySlotId.get(slot.id);
        const disabled = slot.startsAtUtc <= day.nowUtc || Boolean(occupied);
        const boundary = scheduleTimeBoundary(slot.startsAtUtc, timeFormatter);
        return (
          <button
            key={slot.id}
            id={`schedule-cell-${dayIndex}-${row}`}
            data-column={dayIndex}
            data-row={row}
            type="button"
            role="gridcell"
            data-slot-id={slot.id}
            data-starts-at-utc={slot.startsAtUtc}
            data-time-boundary={boundary}
            data-current-day={currentDay || undefined}
            tabIndex={slot.id === firstFocusable ? 0 : -1}
            disabled={disabled}
            aria-label={`${formatScheduleCalendarDate(day.date, locale, { dateStyle: 'full' })}, ${timeFormatter.format(slot.startsAtUtc)} – ${disabled ? messages.unavailable : messages.available}`}
            className={cn(
              'touch-manipulation border-b bg-transparent outline-none transition-colors hover:bg-accent/50 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/40',
              boundary === 'hour'
                ? 'border-[var(--schedule-grid-hour-border)]'
                : 'border-[var(--schedule-grid-half-hour-border)]',
            )}
            style={{ gridColumn: 1, gridRow: row + 1 }}
            onClick={() => onSelectSlot(slot)}
            onKeyDown={moveGridFocus}
          />
        );
      })}
      {day.bookings.map((prepared) => {
        const authorColor = prepared.booking.isMine
          ? undefined
          : bookingAuthorColor(prepared.booking.author.id);
        const matchingRow = day.slots.findIndex(
          (slot) =>
            prepared.startsAt >= slot.startsAtUtc &&
            prepared.startsAt < slot.endsAtUtc,
        );
        const row = matchingRow < 0 ? 0 : matchingRow;
        const visibleStart = Math.max(
          prepared.startsAt,
          day.slots[row]?.startsAtUtc ?? prepared.startsAt,
        );
        const span = Math.max(
          1,
          Math.min(
            day.slots.length - row,
            Math.ceil(
              (prepared.endsAt - visibleStart) / BOOKING_SLOT_MILLISECONDS,
            ),
          ),
        );
        const ownership = prepared.booking.isMine
          ? messages.yourBooking
          : prepared.booking.author.name;
        return (
          <button
            key={prepared.booking.id}
            type="button"
            data-booking-ownership={
              prepared.booking.isMine ? 'mine' : 'foreign'
            }
            data-booking-author-color={authorColor}
            data-booking-author-foreground={
              authorColor ? bookingAuthorForeground(authorColor) : undefined
            }
            className={cn(
              'z-10 m-0.5 overflow-hidden rounded-sm border-y-0 border-r-0 border-l-[3px] px-1.5 py-1 text-left text-xs outline-none transition-[background-color,filter,transform] duration-150 hover:brightness-95 focus-visible:z-30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:translate-y-px motion-reduce:transition-none',
              prepared.booking.isMine
                ? 'border-[var(--booking-own-border)] bg-[var(--booking-own-surface)] text-[var(--booking-own-foreground)]'
                : 'border-[var(--booking-foreign-border)] bg-[var(--booking-foreign-surface)] text-[var(--booking-foreign-foreground)]',
            )}
            style={{ gridColumn: 1, gridRow: `${row + 1} / span ${span}` }}
            aria-label={`${messages.accessibility.bookingAtTime}: ${prepared.booking.title}, ${formatScheduleCalendarDate(day.date, locale, { dateStyle: 'full' })}, ${prepared.timeRange}, ${ownership}`}
            onClick={() => onSelectBooking(prepared.booking)}
          >
            <strong className="block truncate">{prepared.booking.title}</strong>
            <span className="mt-0.5 block truncate tabular-nums opacity-90">
              {prepared.timeRange}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-1 truncate opacity-90">
              {prepared.booking.isMine ? (
                <Check aria-hidden="true" className="size-3 shrink-0" />
              ) : (
                <UserRound aria-hidden="true" className="size-3 shrink-0" />
              )}
              <span className="truncate">{ownership}</span>
            </span>
          </button>
        );
      })}
      {day.nowPosition !== undefined ? (
        <div
          aria-hidden="true"
          data-current-time-indicator
          className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-[var(--schedule-current-time)]"
          style={{ top: `${day.nowPosition * rowHeightRem}rem` }}
        >
          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-[var(--schedule-current-time)]" />
        </div>
      ) : null}
    </div>
  );
}

function moveGridFocus(event: KeyboardEvent<HTMLButtonElement>): void {
  const key = event.key;
  const direction = (
    {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      Home: 'home',
      End: 'end',
    } as const
  )[key];
  if (!direction) return;
  event.preventDefault();
  const current = event.currentTarget;
  const grid = current.closest('[role="grid"]');
  if (!grid) return;
  const cells = Array.from(
    grid.querySelectorAll<HTMLButtonElement>('button[role="gridcell"]'),
  ).map<GridCellCoordinate>((cell) => ({
    column: Number(cell.dataset['column']),
    row: Number(cell.dataset['row']),
    disabled: cell.disabled,
  }));
  const currentCoordinate = {
    column: Number(current.dataset['column']),
    row: Number(current.dataset['row']),
    disabled: current.disabled,
  };
  const target = findGridTarget(cells, currentCoordinate, direction);
  if (!target) return;
  grid
    .querySelector<HTMLButtonElement>(
      `button[data-column="${target.column}"][data-row="${target.row}"]`,
    )
    ?.focus();
}
