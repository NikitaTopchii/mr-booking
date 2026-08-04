'use client';

import {
  addCalendarDays,
  calendarDateAt,
  createScheduleSearchParams,
  formatCalendarDate,
  selectedDateFromUrl,
  startOfCalendarWeek,
  type CalendarDate,
} from '@mr-booking/booking-ui';
import type { Locale } from '@mr-booking/shared-i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBrowserTimeZone } from '../../use-browser-time-zone';
import {
  parseMinimumCapacity,
  serializeMinimumCapacity,
} from '../model/room-capacity-filter';
import type { ScheduleNavigationState } from '../types/schedule-feature.types';

export function useScheduleNavigation(
  _locale: Locale,
  nowUtc: number,
): ScheduleNavigationState {
  const router = useRouter();
  const searchParams = useSearchParams();
  const browserTimeZone = useBrowserTimeZone();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const lastNormalizationHref = useRef<string | undefined>(undefined);
  const requestedRoomId = searchParams.get('roomId') ?? undefined;
  const minimumCapacity = parseMinimumCapacity(searchParams.get('minCapacity'));
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
    (
      date: CalendarDate,
      roomId: string | undefined,
      replace = false,
      capacity?: number | null,
    ) => {
      const query = createScheduleSearchParams(searchParams, {
        date: formatCalendarDate(date),
      });
      if (roomId) query.set('roomId', roomId);
      else query.delete('roomId');
      const nextCapacity = capacity === undefined ? minimumCapacity : capacity;
      if (nextCapacity === null) {
        query.delete('minCapacity');
      } else {
        const serializedCapacity = nextCapacity
          ? serializeMinimumCapacity(nextCapacity)
          : undefined;
        if (serializedCapacity) query.set('minCapacity', serializedCapacity);
        else query.delete('minCapacity');
      }
      if (query.toString() === searchParams.toString()) return;
      const href = `?${query.toString()}`;
      if (replace) {
        if (lastNormalizationHref.current === href) return;
        lastNormalizationHref.current = href;
        router.replace(href, { scroll: false });
      } else {
        lastNormalizationHref.current = undefined;
        router.push(href, { scroll: false });
      }
    },
    [minimumCapacity, router, searchParams],
  );

  useEffect(() => {
    const expectedWeek = formatCalendarDate(selectedWeek);
    if (
      searchParams.get('date') !== selectedDateKey ||
      searchParams.get('week') !== expectedWeek
    ) {
      navigate(selectedDate, requestedRoomId, true);
    }
  }, [
    navigate,
    requestedRoomId,
    searchParams,
    selectedDate,
    selectedDateKey,
    selectedWeek,
  ]);

  useEffect(() => {
    if (!minimumCapacityIsCanonical) {
      navigate(selectedDate, requestedRoomId, true);
    }
  }, [
    minimumCapacityIsCanonical,
    navigate,
    requestedRoomId,
    searchParams,
    selectedDate,
  ]);

  return {
    selectedDate,
    selectedDateKey,
    selectedWeek,
    requestedRoomId,
    minimumCapacity,
    selectDate: (date) => navigate(date, requestedRoomId),
    selectRoom: (roomId) => navigate(selectedDate, roomId),
    normalizeRoom: (roomId) => navigate(selectedDate, roomId, true),
    setMinimumCapacity: (value) =>
      navigate(selectedDate, requestedRoomId, false, value),
    clearMinimumCapacity: () =>
      navigate(selectedDate, requestedRoomId, false, null),
    goToPreviousWeek: () =>
      navigate(addCalendarDays(selectedDate, -7), requestedRoomId),
    goToNextWeek: () =>
      navigate(addCalendarDays(selectedDate, 7), requestedRoomId),
    goToToday: () =>
      navigate(calendarDateAt(nowUtc, browserTimeZone), requestedRoomId),
    openCalendar: () => setCalendarOpen(true),
    calendarOpen,
    setCalendarOpen,
  };
}
