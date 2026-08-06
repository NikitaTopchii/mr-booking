import { OFFICE_TIME_ZONE } from '@mr-booking/booking-domain';
import { cn } from '@mr-booking/shared-ui';
import { Info } from 'lucide-react';
import type { ScheduleMessages } from '../types/schedule-feature.types';

export function ScheduleTimeZoneSummary({
  messages,
  browserTimeZone,
  compact = false,
  className,
}: {
  readonly messages: ScheduleMessages;
  readonly browserTimeZone: string;
  readonly compact?: boolean;
  readonly className?: string;
}) {
  const browserTimeZoneDiffers = browserTimeZone !== OFFICE_TIME_ZONE;

  if (!browserTimeZoneDiffers) return null;

  return (
    <div
      role="note"
      data-timezone-summary
      aria-label={messages.officeTimezoneIndicator}
      aria-describedby="schedule-timezone-description"
      className={cn(
        'inline-flex w-fit items-center gap-1.5 text-muted-foreground',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <Info aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{messages.officeTimezoneIndicator}</span>
      <span id="schedule-timezone-description" className="sr-only">
        {messages.timezoneAccessibilityDescription}
      </span>
    </div>
  );
}
