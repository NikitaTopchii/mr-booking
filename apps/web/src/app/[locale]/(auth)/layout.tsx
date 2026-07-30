import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { redirect } from 'next/navigation';
import { requireLocale } from '../locale';
import type { LocaleLayoutProps } from '../types/locale-route.types';

export default async function AuthLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const locale = await requireLocale(params);
  const auth = await resolveServerAuth();

  if (auth.status === 'authenticated') {
    redirect(localizedRoute(locale, '/schedule'));
  }

  return (
    <main className="grid min-h-dvh items-end bg-muted/50 pt-16 md:place-items-center md:bg-background md:p-8">
      {children}
    </main>
  );
}
