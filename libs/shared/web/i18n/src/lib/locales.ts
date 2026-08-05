import {
  supportedLocales,
  type Locale,
  type LocalizedRoute,
} from './types/locale.contracts';

export const defaultLocale: Locale = 'uk';

export function hasLocale(value: string): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}

export function localizedRoute(locale: Locale, route: LocalizedRoute): string {
  return route === '/' ? `/${locale}` : `/${locale}${route}`;
}
