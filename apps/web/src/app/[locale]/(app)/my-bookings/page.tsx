import { Card, CardContent, CardHeader } from '@mr-booking/shared-ui';
import { CalendarPlus, History } from 'lucide-react';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { BookingsEmptyState } from '../bookings-empty-state';
import { requireLocale, type LocaleRouteParams } from '../../locale';

export default async function MyBookingsPage({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);
  const messages = dictionary.myBookings;

  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {messages.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {messages.description}
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="upcoming-bookings-title">
          <CardHeader>
            <h2
              id="upcoming-bookings-title"
              className="text-xl font-semibold tracking-tight"
            >
              {messages.upcoming.title}
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <BookingsEmptyState
              icon={CalendarPlus}
              title={messages.upcoming.emptyTitle}
              description={messages.upcoming.emptyDescription}
              action={{
                href: localizedRoute(locale, '/schedule'),
                label: messages.actions.viewSchedule,
              }}
            />
          </CardContent>
        </Card>

        <Card aria-labelledby="past-bookings-title">
          <CardHeader>
            <h2
              id="past-bookings-title"
              className="text-xl font-semibold tracking-tight"
            >
              {messages.past.title}
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <BookingsEmptyState
              icon={History}
              title={messages.past.emptyTitle}
              description={messages.past.emptyDescription}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
