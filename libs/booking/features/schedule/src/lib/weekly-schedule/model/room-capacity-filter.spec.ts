import type { Room } from '@mr-booking/booking-data-access-web';
import {
  filterRoomsByMinimumCapacity,
  parseMinimumCapacity,
  resolveSelectedRoom,
  serializeMinimumCapacity,
} from './room-capacity-filter';

const rooms: readonly Room[] = [
  { id: 'room-small', name: 'Small', floor: 1, capacity: 4 },
  { id: 'room-medium', name: 'Medium', floor: 2, capacity: 6 },
  { id: 'room-large', name: 'Large', floor: 3, capacity: 10 },
];

describe('room capacity filter model', () => {
  it('returns the original collection when no minimum is active', () => {
    expect(filterRoomsByMinimumCapacity(rooms, undefined)).toBe(rooms);
  });

  it('keeps rooms at or above the minimum in deterministic order', () => {
    expect(filterRoomsByMinimumCapacity(rooms, 1)).toEqual(rooms);
    expect(filterRoomsByMinimumCapacity(rooms, 6)).toEqual([
      rooms[1],
      rooms[2],
    ]);
    expect(filterRoomsByMinimumCapacity(rooms, 10)).toEqual([rooms[2]]);
    expect(filterRoomsByMinimumCapacity(rooms, 20)).toEqual([]);
  });

  it('does not mutate the source collection', () => {
    const source = [...rooms];
    const filtered = filterRoomsByMinimumCapacity(source, 6);

    expect(source).toEqual(rooms);
    expect(filtered).not.toBe(source);
  });

  it('produces equivalent results for equivalent room objects', () => {
    expect(
      filterRoomsByMinimumCapacity(
        rooms.map((room) => ({ ...room })),
        6,
      ),
    ).toEqual(filterRoomsByMinimumCapacity(rooms, 6));
  });
});

describe('minimum capacity URL value', () => {
  it.each([
    [undefined, undefined],
    [null, undefined],
    ['', undefined],
    ['1', 1],
    ['6', 6],
    ['0', undefined],
    ['-2', undefined],
    ['+2', undefined],
    ['4.5', undefined],
    [' 6', undefined],
    ['6 ', undefined],
    ['abc', undefined],
    ['9007199254740992', undefined],
  ])('parses %s as %s', (value, expected) => {
    expect(parseMinimumCapacity(value)).toBe(expected);
  });

  it('serializes only canonical positive safe integers', () => {
    expect(serializeMinimumCapacity(1)).toBe('1');
    expect(serializeMinimumCapacity(6)).toBe('6');
    expect(serializeMinimumCapacity(0)).toBeUndefined();
    expect(serializeMinimumCapacity(-1)).toBeUndefined();
    expect(serializeMinimumCapacity(4.5)).toBeUndefined();
    expect(
      serializeMinimumCapacity(Number.MAX_SAFE_INTEGER + 1),
    ).toBeUndefined();
  });
});

describe('filtered room resolution', () => {
  it('preserves a requested room that still matches', () => {
    expect(resolveSelectedRoom(rooms.slice(1), 'room-large')?.id).toBe(
      'room-large',
    );
  });

  it('falls back to the first matching room for an invalid request', () => {
    expect(resolveSelectedRoom(rooms.slice(1), 'room-small')?.id).toBe(
      'room-medium',
    );
    expect(resolveSelectedRoom(rooms.slice(1), 'missing')?.id).toBe(
      'room-medium',
    );
  });

  it('returns no room when no rooms match', () => {
    expect(resolveSelectedRoom([], 'room-large')).toBeUndefined();
  });

  it('restores a valid current room when a filter is cleared', () => {
    expect(resolveSelectedRoom(rooms, 'room-medium')?.id).toBe('room-medium');
  });
});
