'use client';

import { useCurrentUser } from '@mr-booking/auth-feature-email-verification';
import { WeeklySchedule } from '@mr-booking/booking-feature-web';
import {
  localizedRoute,
  type AppDictionary,
  type Locale,
} from '@mr-booking/shared-i18n';
import { useRouter } from 'next/navigation';

export function SchedulePageClient({
  locale,
  messages,
}: {
  readonly locale: Locale;
  readonly messages: AppDictionary['schedule'];
}) {
  const router = useRouter();
  const { user } = useCurrentUser();

  return (
    <WeeklySchedule
      locale={locale}
      messages={messages}
      emailVerified={user?.emailVerified ?? false}
      onVerificationRequired={() =>
        router.push(`${localizedRoute(locale, '/verify-email')}?reason=booking`)
      }
    />
  );
}
