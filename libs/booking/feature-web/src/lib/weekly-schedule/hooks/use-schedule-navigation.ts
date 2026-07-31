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
  const selectedDate = selectedDateFromUrl(
    searchParams.get('date'),
    searchParams.get('week'),
    nowUtc,
    browserTimeZone,
  );
  const selectedDateKey = formatCalendarDate(selectedDate);
  const selectedWeek = startOfCalendarWeek(selectedDate);

  const navigate = useCallback(
    (date: CalendarDate, roomId = requestedRoomId, replace = false) => {
      const query = createScheduleSearchParams(searchParams, {
        date: formatCalendarDate(date),
        ...(roomId ? { roomId } : {}),
      });
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
    [requestedRoomId, router, searchParams],
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

  return {
    selectedDate,
    selectedDateKey,
    selectedWeek,
    requestedRoomId,
    selectDate: (date) => navigate(date),
    selectRoom: (roomId) => navigate(selectedDate, roomId),
    goToPreviousWeek: () => navigate(addCalendarDays(selectedDate, -7)),
    goToNextWeek: () => navigate(addCalendarDays(selectedDate, 7)),
    goToToday: () => navigate(calendarDateAt(nowUtc, browserTimeZone)),
    openCalendar: () => setCalendarOpen(true),
    calendarOpen,
    setCalendarOpen,
  };
}
