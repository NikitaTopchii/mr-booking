'use client';

import { useBrowserTimeZone } from './use-browser-time-zone';
import { useBookingCancellation } from './weekly-schedule/hooks/use-booking-cancellation';
import { useBookingCreation } from './weekly-schedule/hooks/use-booking-creation';
import { useScheduleClock } from './weekly-schedule/hooks/use-schedule-clock';
import { useScheduleData } from './weekly-schedule/hooks/use-schedule-data';
import { useScheduleNavigation } from './weekly-schedule/hooks/use-schedule-navigation';
import { WeeklyScheduleView } from './weekly-schedule/weekly-schedule-view';
import type { WeeklyScheduleProps } from './weekly-schedule/types/schedule-feature.types';

export function WeeklySchedule({ locale, messages }: WeeklyScheduleProps) {
  const browserTimeZone = useBrowserTimeZone();
  const clock = useScheduleClock();
  const navigation = useScheduleNavigation(locale, clock.nowUtc);
  const data = useScheduleData({ locale, navigation, browserTimeZone });
  const creation = useBookingCreation({ locale, data });
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
    />
  );
}
