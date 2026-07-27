import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { LogoutButton } from '@mr-booking/auth-feature-web';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireLocale, type LocaleRouteParams } from '../locale';

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
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            className="rounded-sm font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={localizedRoute(locale, '/schedule')}
          >
            MR Booking
          </Link>
          <div
            className="flex items-center gap-3 sm:gap-5"
            aria-label={dictionary.application.userMenuLabel}
          >
            <span className="hidden text-right sm:grid">
              <strong className="text-sm font-medium">{auth.user.name}</strong>
              <small className="max-w-56 truncate text-xs text-muted-foreground">
                {auth.user.email}
              </small>
            </span>
            <LogoutButton
              label={dictionary.auth.logout.action}
              submittingLabel={dictionary.auth.logout.submitting}
              errorMessage={dictionary.auth.logout.error}
              successHref={localizedRoute(locale, '/login')}
            />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
