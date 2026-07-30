import { MyBookings } from '@mr-booking/booking-feature-web';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale } from '../../locale';
import type { LocalePageProps } from '../../types/locale-route.types';

export default async function MyBookingsPage({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return <MyBookings locale={locale} messages={dictionary.myBookings} />;
}
