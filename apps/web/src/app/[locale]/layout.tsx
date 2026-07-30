import { getDictionary } from '@mr-booking/shared-i18n/server';
import type { Metadata } from 'next';
import { requireLocale } from './locale';
import type {
  LocaleLayoutProps,
  LocalePageProps,
} from './types/locale-route.types';

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return {
    description: dictionary.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  await requireLocale(params);
  return children;
}
