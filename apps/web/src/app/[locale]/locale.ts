import { hasLocale, type Locale } from '@mr-booking/shared-i18n';
import { notFound } from 'next/navigation';

export interface LocaleRouteParams {
  readonly locale: string;
}

export async function requireLocale(
  params: Promise<LocaleRouteParams>,
): Promise<Locale> {
  const { locale } = await params;

  if (!hasLocale(locale)) {
    notFound();
  }

  return locale;
}
