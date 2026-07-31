'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  BookingClientError,
  cancelBooking,
  isScheduleKeyForRoom,
  type MyBooking,
} from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import type {
  BookingCancellationState,
  CancellationError,
} from '../types/my-bookings.types';

export function useBookingCancellation(
  locale: Locale,
  revalidateUpcoming: () => Promise<unknown>,
): BookingCancellationState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const { mutate } = useSWRConfig();
  const [booking, setBooking] = useState<MyBooking>();
  const [error, setError] = useState<CancellationError>();
  const [wasCancelled, setWasCancelled] = useState(false);
  const mutation = useSWRMutation(
    ['booking', 'mine', 'cancel'],
    (_key, { arg }: { readonly arg: string }) => cancelBooking(arg),
  );

  const confirm = async (): Promise<void> => {
    if (!booking) return;
    setError(undefined);

    try {
      await mutation.trigger(booking.id);
      await Promise.allSettled([
        revalidateUpcoming(),
        mutate((key) => isScheduleKeyForRoom(key, booking.room.id)),
      ]);
      setBooking(undefined);
      setWasCancelled(true);
    } catch (cause) {
      setError(cancellationError(cause));
      redirectIfAuthExpired(cause);

      if (
        cause instanceof BookingClientError &&
        (cause.code === 'BOOKING_NOT_FOUND' ||
          cause.code === 'BOOKING_NOT_CANCELLABLE')
      ) {
        void revalidateUpcoming().catch(() => undefined);
      }
    }
  };

  return {
    booking,
    error,
    isPending: mutation.isMutating,
    wasCancelled,
    request: (selectedBooking) => {
      setBooking(selectedBooking);
      setError(undefined);
      setWasCancelled(false);
    },
    dismiss: () => {
      if (mutation.isMutating) return;
      setBooking(undefined);
      setError(undefined);
    },
    confirm: () => void confirm(),
  };
}

function cancellationError(error: unknown): CancellationError {
  if (!(error instanceof BookingClientError)) return 'service';
  if (error.code === 'UNAUTHENTICATED' || error.status === 401) {
    return 'unauthenticated';
  }
  if (error.code === 'BOOKING_NOT_FOUND') return 'stale';
  if (error.code === 'BOOKING_NOT_CANCELLABLE') return 'notCancellable';
  return 'service';
}
