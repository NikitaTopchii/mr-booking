import { WeeklySchedule } from '@mr-booking/booking-feature-web';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale } from '../../locale';
import type { LocalePageProps } from '../../types/locale-route.types';

export default async function ScheduleShellPage({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return <WeeklySchedule locale={locale} messages={dictionary.schedule} />;
}
