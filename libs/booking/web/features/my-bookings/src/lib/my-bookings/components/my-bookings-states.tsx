import {
  Alert,
  AlertDescription,
  Button,
  Spinner,
} from '@mr-booking/shared-ui';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type {
  MyBookingsEmptyStateProps,
  MyBookingsErrorStateProps,
  MyBookingsLoadingStateProps,
} from '../types/my-bookings.types';

export function LoadingState({ message }: MyBookingsLoadingStateProps) {
  return (
    <div
      className="flex min-h-28 items-center gap-3 border-b border-border text-sm text-muted-foreground"
      role="status"
    >
      <Spinner />
      {message}
    </div>
  );
}

export function ErrorState({
  message,
  retry,
  onRetry,
}: MyBookingsErrorStateProps) {
  return (
    <Alert variant="destructive">
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

export function EmptyState({
  title,
  description,
  action,
}: MyBookingsEmptyStateProps) {
  return (
    <div className="flex flex-col justify-center border-b border-border py-5 text-left">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <Button asChild className="mt-4 w-fit">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
