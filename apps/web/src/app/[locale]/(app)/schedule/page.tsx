import { WeeklySchedule } from '@mr-booking/booking-feature-web';
import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale, type LocaleRouteParams } from '../../locale';

export default async function ScheduleShellPage({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return <WeeklySchedule locale={locale} messages={dictionary.schedule} />;
}
