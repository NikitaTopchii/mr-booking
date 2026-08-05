'use client';

import { useBrowserTimeZone } from '@mr-booking/booking-ui';
import { useBookingCancellation } from './hooks/use-booking-cancellation';
import { useMyPastBookings } from './hooks/use-my-past-bookings';
import { useMyUpcomingBookings } from './hooks/use-my-upcoming-bookings';
import { MyBookingsView } from './my-bookings-view';
import type { MyBookingsProps } from './types/my-bookings.types';

export function MyBookings({ locale, messages }: MyBookingsProps) {
  const browserTimeZone = useBrowserTimeZone();
  const upcoming = useMyUpcomingBookings(locale);
  const past = useMyPastBookings(locale);
  const cancellation = useBookingCancellation(locale, upcoming.revalidate);

  return (
    <MyBookingsView
      locale={locale}
      messages={messages}
      browserTimeZone={browserTimeZone}
      upcoming={upcoming}
      past={past}
      cancellation={cancellation}
    />
  );
}
