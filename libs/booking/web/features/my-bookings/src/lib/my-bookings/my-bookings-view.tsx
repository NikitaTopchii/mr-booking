import type { MyBookingsViewProps } from './types/my-bookings.types';
import { CancellationDialog } from './components/cancellation-dialog';
import { PastBookingsSection } from './components/past-bookings-section';
import { UpcomingBookingsSection } from './components/upcoming-bookings-section';

export function MyBookingsView({
  locale,
  messages,
  browserTimeZone,
  upcoming,
  past,
  cancellation,
}: MyBookingsViewProps) {
  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-var(--app-header-height))] max-w-4xl px-3 py-5 sm:px-6 sm:py-8"
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {messages.title}
        </h1>
      </header>

      {cancellation.wasCancelled ? (
        <p
          role="status"
          className="mt-4 border-y border-border py-3 text-sm font-medium"
        >
          {messages.cancellation.success}
        </p>
      ) : null}

      <div className="mt-6 grid gap-7">
        <UpcomingBookingsSection
          locale={locale}
          browserTimeZone={browserTimeZone}
          messages={messages}
          {...upcoming}
          onCancel={cancellation.request}
        />
        <PastBookingsSection
          locale={locale}
          browserTimeZone={browserTimeZone}
          messages={messages}
          {...past}
        />
      </div>

      <CancellationDialog
        booking={cancellation.booking}
        locale={locale}
        browserTimeZone={browserTimeZone}
        messages={messages}
        error={cancellation.error}
        pending={cancellation.isPending}
        onDismiss={cancellation.dismiss}
        onConfirm={cancellation.confirm}
      />
    </main>
  );
}
