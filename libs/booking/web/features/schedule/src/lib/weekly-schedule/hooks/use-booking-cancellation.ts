'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  cancelBooking,
  type ScheduleBooking,
} from '@mr-booking/booking-data-access-web';
import {
  createFeatureErrorFactory,
  defaultFeatureErrorReporter,
  systemFeatureErrorClock,
} from '@mr-booking/shared-error-handling';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { bookingClientErrorStatus } from '../errors/booking-client-error.context';
import { classifyBookingCancellationError } from '../errors/booking-cancellation-error.classifier';
import { bookingCancellationErrorCatalog } from '../errors/booking-cancellation-error.catalog';
import type {
  BookingCancellationFeatureError,
  BookingCancellationErrorContext,
  ScheduleErrorDependencies,
} from '../errors/schedule-error.types';
import type {
  BookingCancellationState,
  ScheduleDataState,
} from '../types/schedule-feature.types';

export function useBookingCancellation({
  locale,
  data,
  nowUtc,
  errorDependencies,
}: {
  readonly locale: Locale;
  readonly data: ScheduleDataState;
  readonly nowUtc: number;
  readonly errorDependencies?: ScheduleErrorDependencies;
}): BookingCancellationState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const errorClock = errorDependencies?.clock ?? systemFeatureErrorClock;
  const errorReporter =
    errorDependencies?.reporter ?? defaultFeatureErrorReporter;
  const errorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'weeklySchedule',
        'cancelBooking',
        typeof bookingCancellationErrorCatalog,
        BookingCancellationErrorContext
      >({
        feature: 'weeklySchedule',
        operation: 'cancelBooking',
        catalog: bookingCancellationErrorCatalog,
        clock: errorClock,
        reporter: errorReporter,
      }),
    [errorClock, errorReporter],
  );
  const operationAttempt = useRef(0);
  const [booking, setBooking] = useState<ScheduleBooking>();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<BookingCancellationFeatureError>();
  const [notice, setNotice] = useState<'cancelled'>();
  const currentRoomIdRef = useRef<string | undefined>(data.selectedRoom?.id);
  currentRoomIdRef.current = data.selectedRoom?.id;
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

  useEffect(() => {
    if (!booking || booking.roomId === data.selectedRoom?.id) return;

    setBooking(undefined);
    setConfirming(false);
    setError(undefined);
    setNotice(undefined);
  }, [booking, data.selectedRoom?.id]);

  const openBooking = useCallback((selected: ScheduleBooking) => {
    setBooking(selected);
    setError(undefined);
    setConfirming(false);
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
    const attempt = ++operationAttempt.current;
    const roomId = booking.roomId;
    setError(undefined);
    try {
      await mutation.trigger(booking.id);
      await data.revalidateSchedule();
      if (currentRoomIdRef.current !== roomId) return;
      setBooking(undefined);
      setConfirming(false);
      setError(undefined);
      setNotice('cancelled');
    } catch (cause) {
      if (currentRoomIdRef.current !== roomId) return;
      if (redirectIfAuthExpired(cause)) return;
      const status = bookingClientErrorStatus(cause);
      const context: BookingCancellationErrorContext = {
        bookingId: booking.id,
        roomId: booking.roomId,
        operationAttempt: attempt,
        ...(status === undefined ? {} : { status }),
      };
      setError(
        errorFactory.create({
          code: classifyBookingCancellationError(cause),
          context,
          cause,
        }),
      );
    }
  }, [booking, canCancel, data, errorFactory, mutation, redirectIfAuthExpired]);

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
