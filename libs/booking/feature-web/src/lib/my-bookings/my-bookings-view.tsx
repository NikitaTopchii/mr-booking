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
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-6xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {messages.description}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.localTime}: {browserTimeZone}
        </p>
      </header>

      {cancellation.wasCancelled ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm font-medium"
        >
          {messages.cancellation.success}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6">
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
