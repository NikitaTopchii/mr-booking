import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
} from '@mr-booking/shared-ui';
import { AlertCircle } from 'lucide-react';
import type { SchedulePresentation } from '@mr-booking/booking-ui';

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
    <div className="mt-4 grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
      {message}
    </div>
  );
}
