import { getDictionary } from '@mr-booking/shared-i18n/server';
import type { Metadata } from 'next';
import { requireLocale } from '../../locale';
import type { LocalePageProps } from '../../types/locale-route.types';
import { AuthPage } from '../auth-page';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);
  return { title: dictionary.metadata.loginTitle };
}

export default async function LoginPage({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  return <AuthPage locale={locale} mode="login" />;
}
