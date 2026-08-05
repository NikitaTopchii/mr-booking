'use client';

import { useSyncExternalStore } from 'react';
import type { SchedulePresentation } from '../types/schedule.types';

const mediumQuery = '(min-width: 640px) and (max-width: 1023px)';
const expandedQuery = '(min-width: 1024px)';

function subscribe(onChange: () => void): () => void {
  const medium = window.matchMedia(mediumQuery);
  const expanded = window.matchMedia(expandedQuery);
  medium.addEventListener('change', onChange);
  expanded.addEventListener('change', onChange);
  return () => {
    medium.removeEventListener('change', onChange);
    expanded.removeEventListener('change', onChange);
  };
}

function getSnapshot(): SchedulePresentation {
  if (window.matchMedia(expandedQuery).matches) return 'expanded';
  if (window.matchMedia(mediumQuery).matches) return 'medium';
  return 'compact';
}

export function useSchedulePresentation(): SchedulePresentation | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
