import { CalendarPlus } from 'lucide-react';
import type { UpcomingBookingsSectionProps } from '../types/my-bookings.types';
import { BookingList } from './booking-list';
import { BookingSection } from './booking-section';
import { EmptyState, ErrorState, LoadingState } from './my-bookings-states';

export function UpcomingBookingsSection({
  locale,
  browserTimeZone,
  messages,
  items,
  isLoading,
  hasError,
  retry,
  onCancel,
}: UpcomingBookingsSectionProps) {
  return (
    <BookingSection
      id="upcoming-bookings"
      title={messages.upcoming.title}
      icon={CalendarPlus}
      {...(!isLoading && !hasError ? { count: items.length } : {})}
    >
      {isLoading ? (
        <LoadingState message={messages.loading} />
      ) : hasError ? (
        <ErrorState
          message={messages.upcoming.error}
          retry={messages.retry}
          onRetry={retry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={messages.upcoming.emptyTitle}
          description={messages.upcoming.emptyDescription}
          action={{
            href: `/${locale}/schedule`,
            label: messages.actions.viewSchedule,
          }}
        />
      ) : (
        <BookingList
          bookings={items}
          locale={locale}
          browserTimeZone={browserTimeZone}
          messages={messages}
          onCancel={onCancel}
        />
      )}
    </BookingSection>
  );
}
