'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  bookingKeys,
  listMyUpcomingBookings,
} from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import useSWR from 'swr';
import type { MyUpcomingBookingsState } from '../types/my-bookings.types';

export function useMyUpcomingBookings(locale: Locale): MyUpcomingBookingsState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const query = useSWR(bookingKeys.mineUpcoming(), listMyUpcomingBookings, {
    revalidateOnFocus: true,
    onError: redirectIfAuthExpired,
  });

  return {
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    hasError: Boolean(query.error),
    retry: () => void query.mutate(),
    revalidate: query.mutate,
  };
}
