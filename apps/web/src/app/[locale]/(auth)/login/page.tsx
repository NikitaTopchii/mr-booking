import { getDictionary } from '@mr-booking/shared-i18n/server';
import type { Metadata } from 'next';
import { requireLocale, type LocaleRouteParams } from '../../locale';
import { AuthPage } from '../auth-page';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}): Promise<Metadata> {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);
  return { title: dictionary.metadata.loginTitle };
}

export default async function LoginPage({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  return <AuthPage locale={locale} mode="login" />;
}
