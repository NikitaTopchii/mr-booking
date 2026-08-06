import { Alert, AlertDescription, Button } from '@mr-booking/shared-ui';
import { AlertCircle, History } from 'lucide-react';
import type { PastBookingsSectionProps } from '../types/my-bookings.types';
import { BookingList } from './booking-list';
import { BookingSection } from './booking-section';
import { EmptyState, ErrorState, LoadingState } from './my-bookings-states';

export function PastBookingsSection({
  locale,
  browserTimeZone,
  messages,
  items,
  isLoading,
  isLoadingMore,
  hasNextPage,
  error,
  loadMore,
  retry,
}: PastBookingsSectionProps) {
  return (
    <BookingSection
      id="past-bookings"
      title={messages.past.title}
      icon={History}
      {...(!isLoading && error !== 'initial' ? { count: items.length } : {})}
    >
      {isLoading ? (
        <LoadingState message={messages.loading} />
      ) : error === 'initial' ? (
        <ErrorState
          message={messages.past.error}
          retry={messages.retry}
          onRetry={retry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={messages.past.emptyTitle}
          description={messages.past.emptyDescription}
        />
      ) : (
        <>
          <BookingList
            bookings={items}
            locale={locale}
            browserTimeZone={browserTimeZone}
            messages={messages}
          />
          {error === 'loadMore' ? (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle aria-hidden="true" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{messages.past.loadMoreError}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={retry}
                >
                  {messages.retry}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="mt-5 flex justify-center">
            {hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingMore || error === 'loadMore'}
                onClick={loadMore}
              >
                {isLoadingMore ? messages.loadingMore : messages.loadMore}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">
                {messages.endOfHistory}
              </p>
            )}
          </div>
        </>
      )}
    </BookingSection>
  );
}
