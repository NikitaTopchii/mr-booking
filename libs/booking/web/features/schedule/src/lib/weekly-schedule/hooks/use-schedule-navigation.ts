'use client';

import {
  addCalendarDays,
  calendarDateAt,
  formatCalendarDate,
} from '@mr-booking/shared-date-time';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBrowserTimeZone } from '@mr-booking/booking-ui';
import { startOfOfficeWeek as startOfCalendarWeek } from '@mr-booking/booking-domain';
import { selectedDateFromUrl } from '../model/schedule-calendar-policy';
import {
  parseScheduleRouteState,
  updateScheduleSearchParams,
} from '../model/schedule-navigation';
import type { ScheduleRoutePatch } from '../types/schedule.types';
import type { ScheduleNavigationState } from '../types/schedule-feature.types';

export function useScheduleNavigation(
  _locale: Locale,
  nowUtc: number,
): ScheduleNavigationState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browserTimeZone = useBrowserTimeZone();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const observedSearch = searchParams.toString();
  const latestRouteSearch = useRef(observedSearch);
  const pendingRouteSearch = useRef<string | undefined>(undefined);
  if (pendingRouteSearch.current === observedSearch) {
    pendingRouteSearch.current = undefined;
    latestRouteSearch.current = observedSearch;
  } else if (pendingRouteSearch.current === undefined) {
    latestRouteSearch.current = observedSearch;
  }
  const routeState = parseScheduleRouteState(searchParams);
  const requestedRoomId = routeState.roomId;
  const minimumCapacity = routeState.minimumCapacity;
  const minimumCapacityValues = searchParams.getAll('minCapacity');
  const minimumCapacityIsCanonical =
    minimumCapacity === undefined
      ? minimumCapacityValues.length === 0
      : minimumCapacityValues.length === 1 &&
        minimumCapacityValues[0] === String(minimumCapacity);
  const selectedDate = selectedDateFromUrl(
    searchParams.get('date'),
    searchParams.get('week'),
    nowUtc,
    browserTimeZone,
  );
  const selectedDateKey = formatCalendarDate(selectedDate);
  const selectedWeek = startOfCalendarWeek(selectedDate);

  const navigate = useCallback(
    (patch: ScheduleRoutePatch, replace = false) => {
      const currentSearch =
        pendingRouteSearch.current ?? latestRouteSearch.current;
      const query = updateScheduleSearchParams(currentSearch, patch);
      const nextSearch = query.toString();
      if (nextSearch === currentSearch) return;
      const href = `?${nextSearch}`;
      latestRouteSearch.current = nextSearch;
      pendingRouteSearch.current = nextSearch;
      if (replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router],
  );

  const needsCanonicalNormalization =
    searchParams.get('date') !== selectedDateKey ||
    searchParams.get('week') !== formatCalendarDate(selectedWeek) ||
    !minimumCapacityIsCanonical;
  useEffect(() => {
    if (!needsCanonicalNormalization) return;
    navigate(
      {
        date: selectedDateKey,
        ...(minimumCapacityIsCanonical ? {} : { minimumCapacity: null }),
      },
      true,
    );
  }, [
    minimumCapacityIsCanonical,
    navigate,
    needsCanonicalNormalization,
    selectedDateKey,
  ]);

  const authoritativeSelectedDate = useCallback(() => {
    const current = new URLSearchParams(
      pendingRouteSearch.current ?? latestRouteSearch.current,
    );
    return selectedDateFromUrl(
      current.get('date'),
      current.get('week'),
      nowUtc,
      browserTimeZone,
    );
  }, [browserTimeZone, nowUtc]);

  return {
    selectedDate,
    selectedDateKey,
    selectedWeek,
    requestedRoomId,
    minimumCapacity,
    selectDate: (date) => navigate({ date: formatCalendarDate(date) }),
    selectRoom: (roomId) => navigate({ roomId }),
    normalizeRoom: (roomId) => navigate({ roomId: roomId ?? null }, true),
    setMinimumCapacity: (value, roomId) =>
      navigate(
        {
          minimumCapacity: value,
          ...(roomId === undefined ? {} : { roomId: roomId ?? null }),
        },
        false,
      ),
    clearMinimumCapacity: () => navigate({ minimumCapacity: null }),
    goToPreviousWeek: () =>
      navigate({
        date: formatCalendarDate(
          addCalendarDays(authoritativeSelectedDate(), -7),
        ),
      }),
    goToNextWeek: () =>
      navigate({
        date: formatCalendarDate(
          addCalendarDays(authoritativeSelectedDate(), 7),
        ),
      }),
    goToToday: () =>
      navigate({
        date: formatCalendarDate(calendarDateAt(nowUtc, browserTimeZone)),
      }),
    openCalendar: () => setCalendarOpen(true),
    calendarOpen,
    setCalendarOpen,
  };
}
