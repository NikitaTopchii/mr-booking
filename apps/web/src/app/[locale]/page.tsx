import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { redirect } from 'next/navigation';
import { requireLocale, type LocaleRouteParams } from './locale';

export default async function LocalizedHomePage({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  const auth = await resolveServerAuth();
  redirect(
    localizedRoute(
      locale,
      auth.status === 'authenticated' ? '/schedule' : '/login',
    ),
  );
}
