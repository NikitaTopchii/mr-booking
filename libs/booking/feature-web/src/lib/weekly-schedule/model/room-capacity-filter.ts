import type { Room } from '@mr-booking/booking-data-access-web';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/u;

export function parseMinimumCapacity(
  value: string | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (!POSITIVE_INTEGER_PATTERN.test(value)) return undefined;

  const minimumCapacity = Number(value);
  return Number.isSafeInteger(minimumCapacity) ? minimumCapacity : undefined;
}

export function serializeMinimumCapacity(value: number): string | undefined {
  const serialized = String(value);
  return parseMinimumCapacity(serialized) === value ? serialized : undefined;
}

export function filterRoomsByMinimumCapacity(
  rooms: readonly Room[],
  minimumCapacity: number | undefined,
): readonly Room[] {
  if (minimumCapacity === undefined) return rooms;
  return rooms.filter((room) => room.capacity >= minimumCapacity);
}

export function resolveSelectedRoom(
  rooms: readonly Room[],
  requestedRoomId: string | undefined,
): Room | undefined {
  return rooms.find((room) => room.id === requestedRoomId) ?? rooms[0];
}
