import { EmailVerificationPage } from '@mr-booking/auth-feature-email-verification';
import { resolveServerAuth } from '@mr-booking/auth-data-access-web/server';
import { localizedRoute } from '@mr-booking/shared-i18n';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale } from '../locale';
import type { LocalePageProps } from '../types/locale-route.types';

export default async function VerifyEmailRoute({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  const [auth, dictionary] = await Promise.all([
    resolveServerAuth(),
    getDictionary(locale),
  ]);

  return (
    <EmailVerificationPage
      locale={locale}
      messages={dictionary.emailVerification}
      initialUser={auth.status === 'authenticated' ? auth.user : undefined}
      scheduleHref={localizedRoute(locale, '/schedule')}
      loginHref={localizedRoute(locale, '/login')}
    />
  );
}
