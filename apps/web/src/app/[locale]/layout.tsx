import { getDictionary } from '@mr-booking/shared-i18n/server';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireLocale, type LocaleRouteParams } from './locale';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}): Promise<Metadata> {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return {
    description: dictionary.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  readonly children: ReactNode;
  readonly params: Promise<LocaleRouteParams>;
}) {
  await requireLocale(params);
  return children;
}
