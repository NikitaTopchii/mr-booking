export const supportedLocales = ['uk', 'en'] as const;

export type Locale = (typeof supportedLocales)[number];

export type LocalizedRoute =
  '/' | '/login' | '/register' | '/schedule' | '/my-bookings' | '/verify-email';
