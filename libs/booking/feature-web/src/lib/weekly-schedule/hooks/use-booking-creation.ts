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
import { createBookingEndOptions } from '../model/create-booking-end-options';
import { MAX_BOOKING_SLOT_COUNT } from '../constants/schedule.constants';
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
  nowUtc,
  errorDependencies,
  onVerificationRequired,
}: {
  readonly locale: Locale;
  readonly data: ScheduleDataState;
  readonly nowUtc: number;
  readonly errorDependencies?: ScheduleErrorDependencies;
  readonly onVerificationRequired?: () => void;
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
  const lastStableOptions = useRef<
    { readonly slotId: string; readonly options: readonly string[] } | undefined
  >(undefined);
  const [selection, setSelection] = useState<BookingSelection>();
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [suppressReconciliation, setSuppressReconciliation] = useState(false);
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
  const resolvedSlot = useMemo(
    () =>
      selection && data.presentationRange
        ? data.presentationRange.slots.find(
            (slot) => slot.id === selection.slotId,
          )
        : undefined,
    [data.presentationRange, selection],
  );
  const calculatedEndOptions = useMemo(
    () =>
      selection && resolvedSlot && data.presentationRange && data.selectedRoom
        ? createBookingEndOptions({
            selectedSlot: resolvedSlot,
            slots: data.presentationRange.slots,
            bookings: data.bookings,
            roomId: data.selectedRoom.id,
            maximumDurationSlots: MAX_BOOKING_SLOT_COUNT,
          })
        : [],
    [
      data.bookings,
      data.presentationRange,
      data.selectedRoom,
      resolvedSlot,
      selection,
    ],
  );
  const scheduleIsUnstable =
    data.isLoadingSchedule || !data.hasScheduleData || data.isRevalidating;
  const endOptions =
    selection &&
    scheduleIsUnstable &&
    lastStableOptions.current?.slotId === selection.slotId
      ? lastStableOptions.current.options
      : calculatedEndOptions;
  const displaySlot = resolvedSlot ?? selection?.slot;

  useEffect(() => {
    if (!selection || scheduleIsUnstable) return;
    lastStableOptions.current = {
      slotId: selection.slotId,
      options: calculatedEndOptions,
    };
  }, [calculatedEndOptions, scheduleIsUnstable, selection]);

  useEffect(() => {
    if (!selection || suppressReconciliation) return;
    if (scheduleIsUnstable) {
      setReconciling(true);
      return;
    }
    setReconciling(false);
    if (!resolvedSlot || calculatedEndOptions.length === 0) {
      setEndsAt('');
      if (
        error?.code !== 'conflict' &&
        data.selectedRoom &&
        data.presentation
      ) {
        setError(
          errorFactory.create({
            code: 'conflict',
            context: {
              roomId: data.selectedRoom.id,
              startsAtUtc: resolvedSlot
                ? new Date(resolvedSlot.startsAtUtc).toISOString()
                : new Date(selection.slot.startsAtUtc).toISOString(),
              endsAtUtc: '',
              presentation: data.presentation,
              operationAttempt: operationAttempt.current,
            },
          }),
        );
      }
      return;
    }
    if (calculatedEndOptions.includes(endsAt)) return;

    const previousEnd = Date.parse(endsAt);
    const shorterOptions = Number.isFinite(previousEnd)
      ? calculatedEndOptions.filter(
          (option) => Date.parse(option) <= previousEnd,
        )
      : [];
    const reconciledEnd = shorterOptions.at(-1) ?? calculatedEndOptions[0];
    if (reconciledEnd) setEndsAt(reconciledEnd);
  }, [
    calculatedEndOptions,
    scheduleIsUnstable,
    suppressReconciliation,
    data.presentation,
    data.selectedRoom,
    endsAt,
    error,
    errorFactory,
    resolvedSlot,
    selection,
  ]);

  const openForSlot = useCallback(
    (slot: ScheduleSlot) => {
      const currentSlot = data.presentationRange?.slots.find(
        (candidate) => candidate.id === slot.id,
      );
      const options =
        currentSlot && data.presentationRange && data.selectedRoom
          ? createBookingEndOptions({
              selectedSlot: currentSlot,
              slots: data.presentationRange.slots,
              bookings: data.bookings,
              roomId: data.selectedRoom.id,
              maximumDurationSlots: MAX_BOOKING_SLOT_COUNT,
            })
          : [];
      setSelection({ slotId: slot.id, slot: currentSlot ?? slot });
      setTitle('');
      setEndsAt(options[0] ?? '');
      setReconciling(false);
      setSuppressReconciliation(false);
      setError(undefined);
      setNotice(undefined);
      lastStableOptions.current = {
        slotId: slot.id,
        options,
      };
    },
    [data.bookings, data.presentationRange, data.selectedRoom],
  );
  const close = useCallback(() => {
    if (mutation.isMutating || reconciling) return;
    setSelection(undefined);
    setTitle('');
    setEndsAt('');
    setReconciling(false);
    setSuppressReconciliation(false);
    setError(undefined);
  }, [mutation.isMutating, reconciling]);
  const submit = useCallback(async () => {
    if (!selection || !data.selectedRoom || !data.presentation) return;
    if (reconciling || scheduleIsUnstable) return;
    const attempt = ++operationAttempt.current;
    const currentSlot = data.presentationRange?.slots.find(
      (slot) => slot.id === selection.slotId,
    );
    const startsAtUtc = currentSlot
      ? new Date(currentSlot.startsAtUtc).toISOString()
      : new Date(selection.slot.startsAtUtc).toISOString();
    const contextBase = {
      roomId: data.selectedRoom.id,
      startsAtUtc,
      endsAtUtc: endsAt,
      presentation: data.presentation,
      operationAttempt: attempt,
    };
    if (!currentSlot) {
      setError(errorFactory.create({ code: 'conflict', context: contextBase }));
      return;
    }
    if (currentSlot.startsAtUtc <= nowUtc) {
      setError(
        errorFactory.create({ code: 'startNotInFuture', context: contextBase }),
      );
      return;
    }
    const normalizedTitle = title.trim();
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
        startsAtUtc,
        endsAtUtc: endsAt,
      });
      setSuppressReconciliation(true);
      await data.revalidateSchedule();
      setSelection(undefined);
      setTitle('');
      setEndsAt('');
      setError(undefined);
      setSuppressReconciliation(false);
      setNotice('created');
    } catch (cause) {
      setSuppressReconciliation(false);
      if (redirectIfAuthExpired(cause)) return;
      const code = classifyBookingCreationError(cause);
      if (code === 'emailVerificationRequired') {
        setSelection(undefined);
        onVerificationRequired?.();
        return;
      }
      const status = bookingClientErrorStatus(cause);
      const context: BookingCreationErrorContext = {
        ...contextBase,
        ...(status === undefined ? {} : { status }),
      };
      setError(errorFactory.create({ code, context, cause }));
      if (code === 'conflict') {
        setReconciling(true);
        try {
          await data.revalidateSchedule();
        } catch (refreshCause) {
          setError(
            errorFactory.create({
              code: 'service',
              context,
              cause: refreshCause,
            }),
          );
        } finally {
          setReconciling(false);
        }
      }
    } finally {
      setSuppressReconciliation(false);
    }
  }, [
    data,
    endOptions,
    endsAt,
    errorFactory,
    mutation,
    nowUtc,
    onVerificationRequired,
    reconciling,
    redirectIfAuthExpired,
    selection,
    title,
  ]);

  return {
    selection: selection
      ? { ...selection, slot: displaySlot ?? selection.slot }
      : undefined,
    title,
    endsAt,
    endOptions,
    pending: mutation.isMutating,
    reconciling,
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
