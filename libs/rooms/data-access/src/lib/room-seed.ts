import type { DatabaseConnection } from '@mr-booking/shared-database';
import { DEMO_ROOM_IDS } from '@mr-booking/rooms-domain';
import { rooms } from '@mr-booking/rooms-infrastructure/schema';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const seedCreatedAtUtc = Date.UTC(2026, 0, 1);

export const deterministicRooms = [
  {
    id: DEMO_ROOM_IDS.aquarium,
    name: 'Акваріум',
    floor: 1,
    capacity: 4,
    createdAtUtc: seedCreatedAtUtc,
  },
  {
    id: DEMO_ROOM_IDS.mars,
    name: 'Марс',
    floor: 2,
    capacity: 6,
    createdAtUtc: seedCreatedAtUtc,
  },
  {
    id: DEMO_ROOM_IDS.gagarin,
    name: 'Гагарін',
    floor: 2,
    capacity: 8,
    createdAtUtc: seedCreatedAtUtc,
  },
  {
    id: DEMO_ROOM_IDS.orbit,
    name: 'Орбіта',
    floor: 3,
    capacity: 10,
    createdAtUtc: seedCreatedAtUtc,
  },
  {
    id: DEMO_ROOM_IDS.dnipro,
    name: 'Дніпро',
    floor: 3,
    capacity: 12,
    createdAtUtc: seedCreatedAtUtc,
  },
  {
    id: DEMO_ROOM_IDS.kyiv,
    name: 'Київ',
    floor: 4,
    capacity: 16,
    createdAtUtc: seedCreatedAtUtc,
  },
] as const;

export function seedRooms(connection: DatabaseConnection): void {
  const database = drizzle(connection.sqlite, { schema: { rooms } });

  connection.withImmediateTransaction(() => {
    for (const room of deterministicRooms) {
      database
        .insert(rooms)
        .values(room)
        .onConflictDoUpdate({
          target: rooms.id,
          set: {
            name: room.name,
            floor: room.floor,
            capacity: room.capacity,
          },
        })
        .run();
    }
  });
}
