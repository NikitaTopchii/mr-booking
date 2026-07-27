import { getDictionary } from '@mr-booking/shared-i18n/server';
import { requireLocale, type LocaleRouteParams } from '../../locale';

export default async function ScheduleShellPage({
  params,
}: {
  readonly params: Promise<LocaleRouteParams>;
}) {
  const locale = await requireLocale(params);
  const dictionary = await getDictionary(locale);

  return (
    <main
      id="main-content"
      className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {dictionary.schedule.scheduleTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        {dictionary.schedule.scheduleDescription}
      </p>
    </main>
  );
}
