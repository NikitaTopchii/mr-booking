'use client';

import { useAuthExpiryRedirect } from '@mr-booking/auth-ui';
import {
  bookingKeys,
  fetchRoomBookingsByKey,
  listRooms,
} from '@mr-booking/booking-data-access-web';
import { createPresentationRange } from '@mr-booking/booking-ui';
import type { Locale } from '@mr-booking/shared-i18n';
import useSWR from 'swr';
import { useEffect, useMemo } from 'react';
import { useSchedulePresentation } from '../../use-schedule-presentation';
import type {
  ScheduleDataState,
  ScheduleNavigationState,
} from '../types/schedule-feature.types';

export function useScheduleData({
  locale,
  navigation,
  browserTimeZone,
}: {
  readonly locale: Locale;
  readonly navigation: ScheduleNavigationState;
  readonly browserTimeZone: string;
}): ScheduleDataState {
  const presentation = useSchedulePresentation();
  const redirectIfAuthExpired = useAuthExpiryRedirect(locale);
  const roomsQuery = useSWR(bookingKeys.rooms(), listRooms, {
    revalidateOnFocus: false,
    onError: redirectIfAuthExpired,
  });
  const rooms = roomsQuery.data ?? [];
  const selectedRoom =
    rooms.find(({ id }) => id === navigation.requestedRoomId) ?? rooms[0];
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
    onError: redirectIfAuthExpired,
  });

  useEffect(() => {
    if (
      roomsQuery.data &&
      selectedRoom &&
      navigation.requestedRoomId !== selectedRoom.id
    ) {
      navigation.selectRoom(selectedRoom.id);
    }
  }, [navigation, navigation.requestedRoomId, roomsQuery.data, selectedRoom]);

  return {
    presentation,
    rooms,
    selectedRoom,
    presentationRange,
    bookings: scheduleQuery.data ?? [],
    isLoadingRooms: roomsQuery.isLoading,
    isLoadingSchedule: scheduleQuery.isLoading,
    isRevalidating: scheduleQuery.isValidating,
    roomsError: Boolean(roomsQuery.error),
    scheduleError: Boolean(scheduleQuery.error),
    retryRooms: () => void roomsQuery.mutate(),
    retrySchedule: () => void scheduleQuery.mutate(),
    revalidateSchedule: scheduleQuery.mutate,
  };
}
