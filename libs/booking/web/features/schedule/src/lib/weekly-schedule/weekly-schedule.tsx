'use client';

import { useBrowserTimeZone } from '@mr-booking/booking-ui';
import { useBookingCancellation } from './hooks/use-booking-cancellation';
import { useBookingCreation } from './hooks/use-booking-creation';
import { useScheduleClock } from './hooks/use-schedule-clock';
import { useScheduleData } from './hooks/use-schedule-data';
import { useScheduleNavigation } from './hooks/use-schedule-navigation';
import { WeeklyScheduleView } from './weekly-schedule-view';
import type { WeeklyScheduleProps } from './types/schedule-feature.types';

export function WeeklySchedule({
  locale,
  messages,
  emailVerified = true,
  onVerificationRequired,
}: WeeklyScheduleProps) {
  const browserTimeZone = useBrowserTimeZone();
  const clock = useScheduleClock();
  const navigation = useScheduleNavigation(locale, clock.nowUtc);
  const data = useScheduleData({ locale, navigation, browserTimeZone });
  const creation = useBookingCreation({
    locale,
    data,
    nowUtc: clock.nowUtc,
    ...(onVerificationRequired ? { onVerificationRequired } : {}),
  });
  const cancellation = useBookingCancellation({
    locale,
    data,
    nowUtc: clock.nowUtc,
  });

  return (
    <WeeklyScheduleView
      locale={locale}
      messages={messages}
      browserTimeZone={browserTimeZone}
      navigation={navigation}
      clock={clock}
      data={data}
      creation={creation}
      cancellation={cancellation}
      emailVerified={emailVerified}
      {...(onVerificationRequired ? { onVerificationRequired } : {})}
    />
  );
}
