'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  cancelBooking,
  type ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { mapScheduleClientError } from '../errors/schedule-client-error.mapper';
import type {
  BookingCancellationState,
  ScheduleDataState,
} from '../types/schedule-feature.types';

export function useBookingCancellation({
  locale,
  data,
  nowUtc,
}: {
  readonly locale: Locale;
  readonly data: ScheduleDataState;
  readonly nowUtc: number;
}): BookingCancellationState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const [booking, setBooking] = useState<ScheduleBooking>();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] =
    useState<ReturnType<typeof mapScheduleClientError>>();
  const [notice, setNotice] = useState<'cancelled'>();
  const mutation = useSWRMutation(
    ['booking', 'cancel'],
    (_key, { arg }: { readonly arg: string }) => cancelBooking(arg),
  );
  const canCancel =
    Boolean(booking?.isMine) &&
    Boolean(booking && Date.parse(booking.startsAtUtc) > nowUtc);

  useEffect(() => {
    setConfirming(false);
    setError(undefined);
  }, [booking]);

  const openBooking = useCallback((selected: ScheduleBooking) => {
    setBooking(selected);
    setNotice(undefined);
  }, []);
  const closeBooking = useCallback(() => {
    if (mutation.isMutating) return;
    setBooking(undefined);
    setConfirming(false);
    setError(undefined);
  }, [mutation.isMutating]);
  const confirmCancellation = useCallback(async () => {
    if (!booking || !canCancel) return;
    try {
      await mutation.trigger(booking.id);
      await data.revalidateSchedule();
      setBooking(undefined);
      setConfirming(false);
      setNotice('cancelled');
    } catch (cause) {
      redirectIfAuthExpired(cause);
      setError(mapScheduleClientError(cause));
    }
  }, [booking, canCancel, data, mutation, redirectIfAuthExpired]);

  return {
    booking,
    confirming,
    canCancel,
    pending: mutation.isMutating,
    error,
    notice,
    openBooking,
    closeBooking,
    requestConfirmation: () => {
      setError(undefined);
      setConfirming(true);
    },
    dismissConfirmation: () => setConfirming(false),
    confirmCancellation: () => void confirmCancellation(),
  };
}
