import { BOOKING_SLOT_MILLISECONDS } from '@mr-booking/booking-domain';
import type { ScheduleRange, ScheduleSlot } from './types/schedule.types';

export function overlapsAbsoluteRange(
  startsAtUtc: string,
  endsAtUtc: string,
  range: ScheduleRange['range'],
): boolean {
  return (
    Date.parse(startsAtUtc) < Date.parse(range.toUtc) &&
    Date.parse(range.fromUtc) < Date.parse(endsAtUtc)
  );
}

export function currentTimePosition(
  now: number,
  firstSlot: ScheduleSlot | undefined,
  lastSlot: ScheduleSlot | undefined,
): number | undefined {
  if (
    !firstSlot ||
    !lastSlot ||
    now < firstSlot.startsAtUtc ||
    now >= lastSlot.endsAtUtc
  ) {
    return undefined;
  }
  return (now - firstSlot.startsAtUtc) / BOOKING_SLOT_MILLISECONDS;
}
