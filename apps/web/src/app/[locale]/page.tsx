import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { redirect } from 'next/navigation';
import { requireLocale } from './locale';
import type { LocalePageProps } from './types/locale-route.types';

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  const auth = await resolveServerAuth();
  redirect(
    localizedRoute(
      locale,
      auth.status === 'authenticated' ? '/schedule' : '/login',
    ),
  );
}
