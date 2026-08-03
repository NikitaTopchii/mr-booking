import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale } from '../../locale';
import type { LocalePageProps } from '../../types/locale-route.types';
import { SchedulePageClient } from './schedule-page-client';

export default async function ScheduleShellPage({ params }: LocalePageProps) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return <SchedulePageClient locale={locale} messages={dictionary.schedule} />;
}
