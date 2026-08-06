import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
} from '@mr-booking/shared-ui';
import { AlertCircle } from 'lucide-react';
import type { SchedulePresentation } from '../types/schedule.types';

export function ScheduleLoading({
  presentation,
  message,
}: {
  readonly presentation: SchedulePresentation | undefined;
  readonly message: string;
}) {
  const columns =
    presentation === 'expanded' ? 7 : presentation === 'medium' ? 3 : 1;
  return (
    <div
      className="mt-3 border-y border-border py-3"
      role="status"
      aria-label={message}
    >
      <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-8 text-primary" />
        <span>{message}</span>
      </div>
      <div
        data-loading-columns={columns}
        className="grid min-h-80 animate-pulse gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function ScheduleErrorState({
  message,
  retry,
  onRetry,
}: {
  readonly message: string;
  readonly retry: string;
  readonly onRetry: () => void;
}) {
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

export function ScheduleEmptyState({ message }: { readonly message: string }) {
  return (
    <div className="mt-3 grid min-h-48 place-items-center border-y border-dashed border-border p-8 text-center text-muted-foreground">
      {message}
    </div>
  );
}

export function ScheduleNoMatchingRoomsState({
  message,
  clearLabel,
  onClear,
}: {
  readonly message: string;
  readonly clearLabel: string;
  readonly onClear: () => void;
}) {
  return (
    <div
      className="mt-3 grid min-h-48 place-items-center border-y border-dashed border-border p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="grid justify-items-center gap-4">
        <p className="max-w-md text-muted-foreground">{message}</p>
        <Button
          type="button"
          className="min-h-11 touch-manipulation"
          onClick={() => {
            onClear();
            window.requestAnimationFrame(() => {
              document.getElementById('schedule-minimum-capacity')?.focus();
            });
          }}
        >
          {clearLabel}
        </Button>
      </div>
    </div>
  );
}
