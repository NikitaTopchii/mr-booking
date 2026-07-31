'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import { createBooking } from '@mr-booking/booking-data-access-web';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import type { ScheduleSlot } from '@mr-booking/booking-ui';
import {
  createBookingEndOptions,
  defaultBookingEnd,
} from '../model/create-booking-end-options';
import { mapScheduleClientError } from '../errors/schedule-client-error.mapper';
import type {
  BookingCreationState,
  BookingSelection,
  ScheduleDataState,
} from '../types/schedule-feature.types';

export function useBookingCreation({
  locale,
  data,
}: {
  readonly locale: Locale;
  readonly data: ScheduleDataState;
}): BookingCreationState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const [selection, setSelection] = useState<BookingSelection>();
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [error, setError] =
    useState<ReturnType<typeof mapScheduleClientError>>();
  const [notice, setNotice] = useState<'created'>();
  const mutation = useSWRMutation(
    ['booking', 'create'],
    (
      _key,
      {
        arg,
      }: {
        readonly arg: {
          readonly roomId: string;
          readonly title: string;
          readonly startsAtUtc: string;
          readonly endsAtUtc: string;
        };
      },
    ) => createBooking(arg),
  );
  const endOptions = useMemo(
    () =>
      selection && data.presentationRange
        ? createBookingEndOptions(
            selection.slot,
            data.presentationRange.slots,
            data.bookings,
          )
        : [],
    [data.bookings, data.presentationRange, selection],
  );

  useEffect(() => {
    if (selection && !endOptions.includes(endsAt)) {
      setEndsAt(endOptions[0] ?? '');
    }
  }, [endOptions, endsAt, selection]);

  const openForSlot = useCallback((slot: ScheduleSlot) => {
    setSelection({ slot });
    setTitle('');
    setEndsAt(defaultBookingEnd(slot));
    setError(undefined);
    setNotice(undefined);
  }, []);
  const close = useCallback(() => {
    if (mutation.isMutating) return;
    setSelection(undefined);
    setTitle('');
    setEndsAt('');
    setError(undefined);
  }, [mutation.isMutating]);
  const submit = useCallback(async () => {
    if (!selection || !data.selectedRoom) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle || !endOptions.includes(endsAt)) {
      setError('validation');
      return;
    }
    try {
      await mutation.trigger({
        roomId: data.selectedRoom.id,
        title: normalizedTitle,
        startsAtUtc: new Date(selection.slot.startsAtUtc).toISOString(),
        endsAtUtc: endsAt,
      });
      await data.revalidateSchedule();
      setSelection(undefined);
      setTitle('');
      setEndsAt('');
      setError(undefined);
      setNotice('created');
    } catch (cause) {
      redirectIfAuthExpired(cause);
      const kind = mapScheduleClientError(cause);
      setError(kind);
      if (kind === 'conflict') {
        await data.revalidateSchedule();
      }
    }
  }, [
    data,
    endOptions,
    endsAt,
    mutation,
    redirectIfAuthExpired,
    selection,
    title,
  ]);

  return {
    selection,
    title,
    endsAt,
    endOptions,
    pending: mutation.isMutating,
    error,
    notice,
    openForSlot,
    close,
    setTitle: (value) => {
      setNotice(undefined);
      setTitle(value);
    },
    setEnd: (value) => {
      setNotice(undefined);
      setEndsAt(value);
    },
    submit: () => void submit(),
  };
}
