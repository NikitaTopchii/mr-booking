import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireLocale, type LocaleRouteParams } from '../locale';
import { ApplicationShell } from './application-shell';

export default async function ApplicationLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  const [auth, dictionary] = await Promise.all([
    resolveServerAuth(),
    getDictionary(locale),
  ]);

  if (auth.status === 'anonymous') {
    redirect(localizedRoute(locale, '/login'));
  }

  if (auth.status === 'unavailable') {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          MR Booking
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {dictionary.application.serviceUnavailableTitle}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          {dictionary.application.serviceUnavailableDescription}
        </p>
      </main>
    );
  }

  return (
    <ApplicationShell locale={locale} user={auth.user} dictionary={dictionary}>
      {children}
    </ApplicationShell>
  );
}
