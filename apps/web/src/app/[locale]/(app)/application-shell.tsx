import { localizedRoute } from '@mr-booking/shared-i18n';
import Link from 'next/link';
import { ApplicationNavigation } from './application-navigation';
import type { ApplicationShellProps } from './types/application-shell.types';
import { UserMenu } from './user-menu';

export function ApplicationShell({
  locale,
  user,
  dictionary,
  children,
}: ApplicationShellProps) {
  const scheduleHref = localizedRoute(locale, '/schedule');
  const myBookingsHref = localizedRoute(locale, '/my-bookings');

  return (
    <div className="min-h-dvh pb-[var(--mobile-nav-reserved-space)] md:pb-0">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none transition-transform focus:translate-y-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {dictionary.appShell.skipToContent}
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            className="shrink-0 rounded-sm font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={scheduleHref}
          >
            {dictionary.appShell.productName}
          </Link>

          <div className="ml-auto md:ml-5">
            <ApplicationNavigation
              label={dictionary.appShell.navigation.label}
              schedule={{
                href: scheduleHref,
                label: dictionary.appShell.navigation.schedule,
              }}
              myBookings={{
                href: myBookingsHref,
                label: dictionary.appShell.navigation.myBookings,
              }}
            />
          </div>

          <div className="ml-auto">
            <UserMenu
              locale={locale}
              user={user}
              loginHref={localizedRoute(locale, '/login')}
              messages={{
                ...dictionary.appShell.userMenu,
                ukrainian: dictionary.auth.language.ukrainian,
                english: dictionary.auth.language.english,
              }}
            />
          </div>
        </div>
      </header>

      <AuthSessionBoundary initialUser={user}>
        <EmailVerificationBanner
          locale={locale}
          messages={dictionary.emailVerification}
          scheduleHref={scheduleHref}
        />
        {children}
      </AuthSessionBoundary>
    </div>
  );
}
import {
  AuthSessionBoundary,
  EmailVerificationBanner,
} from '@mr-booking/auth-feature-email-verification';
