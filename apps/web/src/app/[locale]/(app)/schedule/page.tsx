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
    <main className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {dictionary.application.protectedEyebrow}
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
        {dictionary.application.scheduleTitle}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
        {dictionary.application.scheduleDescription}
      </p>
    </main>
  );
}
