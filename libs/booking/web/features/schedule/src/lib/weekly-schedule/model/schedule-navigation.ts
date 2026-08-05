import {
  formatCalendarDate,
  parseCalendarDate,
} from '@mr-booking/shared-date-time';
import { startOfOfficeWeek } from '@mr-booking/booking-domain';
import {
  parseMinimumCapacity,
  serializeMinimumCapacity,
} from './room-capacity-filter';
import type {
  ScheduleNavigation,
  ScheduleRoutePatch,
  ScheduleRouteState,
} from '../types/schedule.types';

export function parseScheduleRouteState(
  current: URLSearchParams | string,
): ScheduleRouteState {
  const query = toSearchParams(current);
  const roomId = query.get('roomId');
  const date = query.get('date');
  const week = query.get('week');
  const minimumCapacity = parseMinimumCapacity(query.get('minCapacity'));
  return {
    ...(roomId ? { roomId } : {}),
    ...(date ? { date } : {}),
    ...(week ? { week } : {}),
    ...(minimumCapacity === undefined ? {} : { minimumCapacity }),
  };
}

export function updateScheduleSearchParams(
  current: URLSearchParams | string,
  patch: ScheduleRoutePatch,
): URLSearchParams {
  const query = toSearchParams(current);

  if (patch.date !== undefined) {
    const selectedDate = parseRequiredDate(patch.date);
    query.set('date', formatCalendarDate(selectedDate));
    query.set('week', formatCalendarDate(startOfOfficeWeek(selectedDate)));
  }

  if (patch.roomId !== undefined) {
    if (patch.roomId) query.set('roomId', patch.roomId);
    else query.delete('roomId');
  }

  if (patch.minimumCapacity !== undefined) {
    if (patch.minimumCapacity === null) {
      query.delete('minCapacity');
    } else {
      const serializedCapacity = serializeMinimumCapacity(
        patch.minimumCapacity,
      );
      if (serializedCapacity) query.set('minCapacity', serializedCapacity);
      else query.delete('minCapacity');
    }
  }

  return query;
}

export function createScheduleSearchParams(
  current: URLSearchParams | string,
  navigation: ScheduleNavigation,
): URLSearchParams {
  return updateScheduleSearchParams(current, {
    date: navigation.date,
    ...(navigation.roomId ? { roomId: navigation.roomId } : {}),
  });
}

function parseRequiredDate(value: string) {
  const candidate = parseCalendarDate(value);
  if (!candidate) throw new Error('INVALID_DATE');
  return candidate;
}

function toSearchParams(current: URLSearchParams | string): URLSearchParams {
  return new URLSearchParams(
    typeof current === 'string' ? current : current.toString(),
  );
}
