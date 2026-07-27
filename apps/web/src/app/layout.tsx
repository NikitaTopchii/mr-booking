import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { defaultLocale, hasLocale } from '@mr-booking/shared-i18n';
import './global.css';

export const metadata: Metadata = {
  title: {
    default: 'MR Booking',
    template: '%s',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeHeader = (await headers()).get('x-mr-booking-locale');
  const locale =
    localeHeader && hasLocale(localeHeader) ? localeHeader : defaultLocale;

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
