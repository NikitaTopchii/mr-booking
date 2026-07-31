'use client';

import { useEffect, useState } from 'react';
import { SCHEDULE_CLOCK_INTERVAL_MS } from '../constants/schedule.constants';
import type { ScheduleClockState } from '../types/schedule-feature.types';

export function useScheduleClock(initialNow = Date.now()): ScheduleClockState {
  const [nowUtc, setNowUtc] = useState(initialNow);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNowUtc(Date.now()),
      SCHEDULE_CLOCK_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return { nowUtc };
}
