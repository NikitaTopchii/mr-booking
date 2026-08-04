'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  bookingKeys,
  fetchRoomBookingsByKey,
  listRooms,
} from '@mr-booking/booking-data-access-web';
import { createPresentationRange } from '@mr-booking/booking-ui';
import {
  createFeatureErrorFactory,
  defaultFeatureErrorReporter,
  systemFeatureErrorClock,
} from '@mr-booking/shared-feature-error';
import type { Locale } from '@mr-booking/shared-i18n';
import useSWR from 'swr';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSchedulePresentation } from '../../use-schedule-presentation';
import { bookingClientErrorStatus } from '../errors/booking-client-error.context';
import { classifyRoomQueryError } from '../errors/room-query-error.classifier';
import { roomQueryErrorCatalog } from '../errors/room-query-error.catalog';
import { classifyScheduleQueryError } from '../errors/schedule-query-error.classifier';
import { scheduleQueryErrorCatalog } from '../errors/schedule-query-error.catalog';
import {
  filterRoomsByMinimumCapacity,
  resolveSelectedRoom,
} from '../model/room-capacity-filter';
import type {
  RoomQueryErrorContext,
  ScheduleErrorDependencies,
  ScheduleQueryErrorContext,
} from '../errors/schedule-error.types';
import type {
  RoomQueryFeatureError,
  ScheduleQueryFeatureError,
} from '../errors/schedule-error.types';
import type {
  ScheduleDataState,
  ScheduleNavigationState,
} from '../types/schedule-feature.types';

export function useScheduleData({
  locale,
  navigation,
  browserTimeZone,
  errorDependencies,
}: {
  readonly locale: Locale;
  readonly navigation: ScheduleNavigationState;
  readonly browserTimeZone: string;
  readonly errorDependencies?: ScheduleErrorDependencies;
}): ScheduleDataState {
  const presentation = useSchedulePresentation();
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const errorClock = errorDependencies?.clock ?? systemFeatureErrorClock;
  const errorReporter =
    errorDependencies?.reporter ?? defaultFeatureErrorReporter;
  const roomErrorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'weeklySchedule',
        'loadRooms',
        typeof roomQueryErrorCatalog,
        RoomQueryErrorContext
      >({
        feature: 'weeklySchedule',
        operation: 'loadRooms',
        catalog: roomQueryErrorCatalog,
        clock: errorClock,
        reporter: errorReporter,
      }),
    [errorClock, errorReporter],
  );
  const scheduleErrorFactory = useMemo(
    () =>
      createFeatureErrorFactory<
        'weeklySchedule',
        'loadSchedule',
        typeof scheduleQueryErrorCatalog,
        ScheduleQueryErrorContext
      >({
        feature: 'weeklySchedule',
        operation: 'loadSchedule',
        catalog: scheduleQueryErrorCatalog,
        clock: errorClock,
        reporter: errorReporter,
      }),
    [errorClock, errorReporter],
  );
  const roomsQuery = useSWR(bookingKeys.rooms(), listRooms, {
    revalidateOnFocus: false,
  });
  const [roomsError, setRoomsError] = useState<RoomQueryFeatureError>();
  const [scheduleError, setScheduleError] =
    useState<ScheduleQueryFeatureError>();
  const reportedRoomsFailure = useRef<unknown>(undefined);
  const reportedScheduleFailure = useRef<unknown>(undefined);
  const roomsAttempt = useRef(0);
  const scheduleAttempt = useRef(0);
  const allRooms = roomsQuery.data ?? [];
  const rooms = useMemo(
    () => filterRoomsByMinimumCapacity(allRooms, navigation.minimumCapacity),
    [allRooms, navigation.minimumCapacity],
  );
  const selectedRoom = resolveSelectedRoom(rooms, navigation.requestedRoomId);
  const presentationRange = useMemo(
    () =>
      presentation
        ? createPresentationRange(
            navigation.selectedDate,
            presentation,
            browserTimeZone,
          )
        : undefined,
    [browserTimeZone, navigation.selectedDate, presentation],
  );
  const scheduleKey =
    selectedRoom && presentationRange
      ? bookingKeys.schedule(selectedRoom.id, presentationRange.range)
      : null;
  const scheduleQuery = useSWR(scheduleKey, fetchRoomBookingsByKey, {
    keepPreviousData: false,
  });

  useEffect(() => {
    const cause = roomsQuery.error;
    if (!cause) {
      reportedRoomsFailure.current = undefined;
      setRoomsError(undefined);
      return;
    }
    if (reportedRoomsFailure.current === cause) return;
    reportedRoomsFailure.current = cause;
    if (redirectIfAuthExpired(cause)) {
      setRoomsError(undefined);
      return;
    }
    const status = bookingClientErrorStatus(cause);
    const context: RoomQueryErrorContext = {
      operationAttempt: ++roomsAttempt.current,
      ...(status === undefined ? {} : { status }),
    };
    setRoomsError(
      roomErrorFactory.create({
        code: classifyRoomQueryError(cause),
        context,
        cause,
      }),
    );
  }, [redirectIfAuthExpired, roomErrorFactory, roomsQuery.error]);

  useEffect(() => {
    const cause = scheduleQuery.error;
    if (!cause) {
      reportedScheduleFailure.current = undefined;
      setScheduleError(undefined);
      return;
    }
    if (reportedScheduleFailure.current === cause) return;
    reportedScheduleFailure.current = cause;
    if (redirectIfAuthExpired(cause)) {
      setScheduleError(undefined);
      return;
    }
    if (!selectedRoom) {
      setScheduleError(undefined);
      return;
    }
    const status = bookingClientErrorStatus(cause);
    const context: ScheduleQueryErrorContext = {
      roomId: selectedRoom.id,
      operationAttempt: ++scheduleAttempt.current,
      ...(status === undefined ? {} : { status }),
    };
    setScheduleError(
      scheduleErrorFactory.create({
        code: classifyScheduleQueryError(cause),
        context,
        cause,
      }),
    );
  }, [
    redirectIfAuthExpired,
    scheduleErrorFactory,
    scheduleQuery.error,
    selectedRoom,
  ]);

  const retryRooms = useCallback(() => {
    setRoomsError(undefined);
    void roomsQuery.mutate();
  }, [roomsQuery]);
  const retrySchedule = useCallback(() => {
    setScheduleError(undefined);
    void scheduleQuery.mutate();
  }, [scheduleQuery]);

  useEffect(() => {
    if (roomsQuery.data && navigation.requestedRoomId !== selectedRoom?.id) {
      navigation.normalizeRoom(selectedRoom?.id);
    }
  }, [navigation, navigation.requestedRoomId, roomsQuery.data, selectedRoom]);

  return {
    presentation,
    rooms,
    hasRooms: allRooms.length > 0,
    noMatchingRooms: allRooms.length > 0 && rooms.length === 0,
    selectedRoom,
    presentationRange,
    bookings: selectedRoom ? (scheduleQuery.data ?? []) : [],
    isLoadingRooms: roomsQuery.isLoading,
    isLoadingSchedule: scheduleQuery.isLoading,
    hasScheduleData: Boolean(selectedRoom && scheduleQuery.data !== undefined),
    isRevalidating: scheduleQuery.isValidating,
    roomsError,
    scheduleError,
    retryRooms,
    retrySchedule,
    revalidateSchedule: scheduleQuery.mutate,
  };
}
