'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import { createBooking } from '@mr-booking/booking-data-access-web';
import {
  createFeatureErrorFactory,
  defaultFeatureErrorReporter,
  systemFeatureErrorClock,
} from '@mr-booking/shared-feature-error';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWRMutation from 'swr/mutation';
import type { ScheduleSlot } from '@mr-booking/booking-ui';
import {
  createBookingEndOptions,
  defaultBookingEnd,
} from '../model/create-booking-end-options';
import { bookingClientErrorStatus } from '../errors/booking-client-error.context';
import { classifyBookingCreationError } from '../errors/booking-creation-error.classifier';
import { bookingCreationErrorCatalog } from '../errors/booking-creation-error.catalog';
import type {
  BookingCreationErrorContext,
  BookingCreationFeatureError,
  ScheduleErrorDependencies,
} from '../errors/schedule-error.types';
import type {
  BookingCreationState,
  BookingSelection,
  ScheduleDataState,
} from '../types/schedule-feature.types';

export function useBookingCreation({
  locale,
  data,
  errorDependencies,
}: {
  readonly locale: Locale;
  readonly data: ScheduleDataState;
  readonly errorDependencies?: ScheduleErrorDependencies;
}): BookingCreationState {
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const errorClock = errorDependencies?.clock ?? systemFeatureErrorClock;
  const errorReporter =
    errorDependencies?.reporter ?? defaultFeatureErrorReporter;
  const errorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'weeklySchedule',
        'createBooking',
        typeof bookingCreationErrorCatalog,
        BookingCreationErrorContext
      >({
        feature: 'weeklySchedule',
        operation: 'createBooking',
        catalog: bookingCreationErrorCatalog,
        clock: errorClock,
        reporter: errorReporter,
      }),
    [errorClock, errorReporter],
  );
  const operationAttempt = useRef(0);
  const [selection, setSelection] = useState<BookingSelection>();
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [error, setError] = useState<BookingCreationFeatureError>();
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
    if (!selection || !data.selectedRoom || !data.presentation) return;
    const attempt = ++operationAttempt.current;
    const normalizedTitle = title.trim();
    const contextBase = {
      roomId: data.selectedRoom.id,
      startsAtUtc: new Date(selection.slot.startsAtUtc).toISOString(),
      endsAtUtc: endsAt,
      presentation: data.presentation,
      operationAttempt: attempt,
    };
    if (!normalizedTitle) {
      setError(
        errorFactory.create({ code: 'invalidTitle', context: contextBase }),
      );
      return;
    }
    if (!endOptions.includes(endsAt)) {
      setError(
        errorFactory.create({ code: 'invalidDuration', context: contextBase }),
      );
      return;
    }
    setError(undefined);
    try {
      await mutation.trigger({
        roomId: data.selectedRoom.id,
        title: normalizedTitle,
        startsAtUtc: contextBase.startsAtUtc,
        endsAtUtc: endsAt,
      });
      await data.revalidateSchedule();
      setSelection(undefined);
      setTitle('');
      setEndsAt('');
      setError(undefined);
      setNotice('created');
    } catch (cause) {
      if (redirectIfAuthExpired(cause)) return;
      const code = classifyBookingCreationError(cause);
      const status = bookingClientErrorStatus(cause);
      const context: BookingCreationErrorContext = {
        ...contextBase,
        ...(status === undefined ? {} : { status }),
      };
      setError(errorFactory.create({ code, context, cause }));
      if (code === 'conflict') {
        await data.revalidateSchedule();
      }
    }
  }, [
    data,
    endOptions,
    endsAt,
    errorFactory,
    mutation,
    operationAttempt,
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
      setError(undefined);
      setTitle(value);
    },
    setEnd: (value) => {
      setNotice(undefined);
      setError(undefined);
      setEndsAt(value);
    },
    submit: () => void submit(),
  };
}
