'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  bookingKeys,
  fetchMyPastBookingsPage,
} from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import useSWRInfinite from 'swr/infinite';
import { PAST_BOOKINGS_PAGE_SIZE } from '../constants/my-bookings.constants';
import type { MyPastBookingsState } from '../types/my-bookings.types';

export function useMyPastBookings(locale: Locale): MyPastBookingsState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const query = useSWRInfinite(
    (pageIndex, previousPage) => {
      if (pageIndex > 0 && !previousPage?.nextCursor) return null;

      return bookingKeys.minePast(
        pageIndex === 0 ? null : (previousPage?.nextCursor ?? null),
        PAST_BOOKINGS_PAGE_SIZE,
      );
    },
    fetchMyPastBookingsPage,
    {
      revalidateFirstPage: false,
      onError: redirectIfAuthExpired,
    },
  );
  const items = query.data?.flatMap((page) => page.items) ?? [];
  const lastPage = query.data?.at(-1);
  const isLoadMoreError = Boolean(query.error) && items.length > 0;

  return {
    items,
    isLoading: query.isLoading,
    isLoadingMore:
      query.isValidating &&
      query.data !== undefined &&
      query.size > query.data.length,
    hasNextPage: Boolean(lastPage?.nextCursor),
    error: query.error ? (isLoadMoreError ? 'loadMore' : 'initial') : undefined,
    loadMore: () => void query.setSize((size) => size + 1),
    retry: () => void query.mutate(),
  };
}
