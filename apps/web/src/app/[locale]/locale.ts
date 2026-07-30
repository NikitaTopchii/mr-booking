import { hasLocale, type Locale } from '@mr-booking/shared-i18n';
import { notFound } from 'next/navigation';
import type { LocaleRouteParams } from './types/locale-route.types';

export async function requireLocale(
  params: Promise<LocaleRouteParams>,
): Promise<Locale> {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  return locale;
}
