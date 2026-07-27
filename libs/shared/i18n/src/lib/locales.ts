export const supportedLocales = ['uk', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'uk';

export function hasLocale(value: string): value is Locale {
  return supportedLocales.some((locale) => locale === value);
}

export type LocalizedRoute =
  '/' | '/login' | '/register' | '/schedule' | '/my-bookings';

export function localizedRoute(locale: Locale, route: LocalizedRoute): string {
  return route === '/' ? `/${locale}` : `/${locale}${route}`;
}
