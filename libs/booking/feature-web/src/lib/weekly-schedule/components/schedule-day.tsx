import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import { cn } from '@mr-booking/shared-ui';
import type { KeyboardEvent } from 'react';
import {
  findGridTarget,
  type GridCellCoordinate,
} from '../model/schedule-grid-navigation';
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
  compact,
  occupiedBySlotId,
  onSelectSlot,
  onSelectBooking,
}: ScheduleDayProps) {
  return (
    <div
      className="relative grid border-r border-border last:border-r-0"
      style={{ gridTemplateRows: `repeat(${rowCount}, ${rowHeightRem}rem)` }}
    >
      {day.slots.map((slot, row) => {
        const occupied = occupiedBySlotId.get(slot.id);
        const disabled = slot.startsAtUtc <= day.nowUtc || Boolean(occupied);
        return (
          <button
            key={slot.id}
            id={`schedule-cell-${dayIndex}-${row}`}
            data-column={dayIndex}
            data-row={row}
            type="button"
            role="gridcell"
            tabIndex={slot.id === firstFocusable ? 0 : -1}
            disabled={disabled}
            aria-label={`${formatScheduleCalendarDate(day.date, locale, { dateStyle: 'full' })}, ${timeFormatter.format(slot.startsAtUtc)} – ${disabled ? messages.unavailable : messages.available}`}
            className="touch-manipulation border-b border-border bg-transparent outline-none transition-colors hover:bg-primary/10 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/40"
            style={{ gridColumn: 1, gridRow: row + 1 }}
            onClick={() => onSelectSlot(slot)}
            onKeyDown={moveGridFocus}
          />
        );
      })}
      {day.bookings.map((prepared) => {
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
            className={cn(
              'z-10 m-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              prepared.booking.isMine
                ? 'border-primary/40 bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-secondary-foreground',
            )}
            style={{ gridColumn: 1, gridRow: `${row + 1} / span ${span}` }}
            aria-label={`${messages.accessibility.bookingAtTime}: ${prepared.booking.title}, ${formatScheduleCalendarDate(day.date, locale, { dateStyle: 'full' })}, ${prepared.timeRange}, ${ownership}`}
            onClick={() => onSelectBooking(prepared.booking)}
          >
            <strong className="block truncate">{prepared.booking.title}</strong>
            <span className="mt-0.5 block truncate tabular-nums opacity-90">
              {prepared.timeRange}
            </span>
            {compact || span > 1 ? (
              <span className="mt-0.5 flex items-center gap-1 truncate opacity-90">
                {prepared.booking.isMine ? (
                  <span aria-hidden="true">✓</span>
                ) : null}
                <span className="truncate">{ownership}</span>
              </span>
            ) : null}
          </button>
        );
      })}
      {day.nowPosition !== undefined ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-destructive"
          style={{ top: `${day.nowPosition * rowHeightRem}rem` }}
        >
          <span className="absolute -top-1.5 -left-1 size-3 rounded-full bg-destructive" />
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
