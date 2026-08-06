import { cn } from '@mr-booking/shared-ui';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RoomCapacityFilter } from './room-capacity-filter';
import { ScheduleRoomSelector } from './schedule-room-selector';
import { ScheduleTimeZoneSummary } from './schedule-time-zone-summary';
import type {
  MobileScheduleControlDockProps,
  PendingMobileDockAction,
} from '../types/schedule-feature.types';

const MOBILE_DOCK_PANEL_ID = 'mobile-schedule-control-dock-panel';

export function MobileScheduleControlDock({
  messages,
  rooms,
  room,
  loading,
  onChange,
  browserTimeZone,
  minimumCapacity,
  loadingSchedule,
  hasScheduleError,
  noMatchingRooms,
  onApplyCapacity,
  onClearCapacity,
}: MobileScheduleControlDockProps) {
  const [expanded, setExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingMobileDockAction>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const roomSummary = room
    ? `${room.name} · ${messages.mobile.floor} ${room.floor} · ${room.capacity} ${messages.mobile.capacity}`
    : messages.loadingRooms;
  const filterSummary =
    minimumCapacity === undefined
      ? undefined
      : messages.currentFilterSummary.replace(
          '{capacity}',
          String(minimumCapacity),
        );

  useEffect(() => {
    if (!pendingAction || loading || loadingSchedule || hasScheduleError)
      return;

    const actionApplied =
      (pendingAction.kind === 'room' && room?.id === pendingAction.roomId) ||
      (pendingAction.kind === 'capacity' &&
        minimumCapacity === pendingAction.value &&
        !noMatchingRooms) ||
      (pendingAction.kind === 'clear' && minimumCapacity === undefined);

    if (!actionApplied) return;

    setExpanded(false);
    setPendingAction(undefined);
    triggerRef.current?.focus();
  }, [
    hasScheduleError,
    loading,
    loadingSchedule,
    minimumCapacity,
    noMatchingRooms,
    pendingAction,
    room?.id,
  ]);

  function collapse(): void {
    setExpanded(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      data-mobile-control-dock
      data-expanded={expanded || undefined}
      className="border-b border-border md:hidden"
    >
      <button
        ref={triggerRef}
        type="button"
        data-mobile-control-dock-trigger
        aria-expanded={expanded}
        aria-controls={MOBILE_DOCK_PANEL_ID}
        aria-label={`${messages.mobile.selectedRoom}: ${roomSummary}. ${messages.filterButtonLabel}.`}
        className="flex min-h-14 w-full touch-manipulation items-center gap-2.5 py-2 text-left outline-none transition-colors duration-150 hover:bg-accent/55 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:translate-y-px motion-reduce:transition-none"
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !expanded) return;
          event.preventDefault();
          collapse();
        }}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-primary/10 text-primary">
          <Check aria-hidden="true" className="size-4" />
        </span>
        <span
          data-mobile-room-summary
          data-testid="mobile-room-summary"
          className="min-w-0 flex-1"
        >
          <strong className="block truncate text-sm font-semibold">
            {room?.name ?? messages.loadingRooms}
          </strong>
          {room ? (
            <span className="block truncate text-xs text-muted-foreground">
              {messages.mobile.floor} {room.floor} · {room.capacity}{' '}
              {messages.mobile.capacity}
              {filterSummary ? ` · ${filterSummary}` : ''}
            </span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform duration-[var(--motion-standard)] motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div
        id={MOBILE_DOCK_PANEL_ID}
        data-mobile-control-dock-panel
        aria-hidden={!expanded}
        inert={!expanded ? true : undefined}
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-[var(--motion-standard)] ease-out motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          collapse();
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              'grid gap-3 border-t border-border py-3 transition-opacity duration-150 motion-reduce:transition-none',
              expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <ScheduleRoomSelector
              messages={messages}
              rooms={rooms}
              room={room}
              loading={loading}
              onChange={(roomId) => {
                setPendingAction({ kind: 'room', roomId });
                onChange(roomId);
              }}
            />
            <RoomCapacityFilter
              messages={messages}
              minimumCapacity={minimumCapacity}
              onApply={onApplyCapacity}
              onClear={onClearCapacity}
              onApplied={(value) =>
                setPendingAction({ kind: 'capacity', value })
              }
              onCleared={() => setPendingAction({ kind: 'clear' })}
            />
            <ScheduleTimeZoneSummary
              messages={messages}
              browserTimeZone={browserTimeZone}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
