import type { Room, RoomReader } from '@mr-booking/rooms-domain';
import { rooms } from '@mr-booking/rooms-infrastructure';
import type { DatabaseConnection } from '@mr-booking/shared-database';
import { asc, eq } from 'drizzle-orm';

interface DatabaseConnectionProvider {
  readonly connection: DatabaseConnection;
}

export class DrizzleRoomReader implements RoomReader {
  public constructor(
    private readonly databaseService: DatabaseConnectionProvider,
  ) {}

  public exists(roomId: string): boolean {
    return (
      this.databaseService.connection.drizzle
        .select({ id: rooms.id })
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .get() !== undefined
    );
  }

  public list(): readonly Room[] {
    return this.databaseService.connection.drizzle
      .select({
        id: rooms.id,
        name: rooms.name,
        floor: rooms.floor,
        capacity: rooms.capacity,
      })
      .from(rooms)
      .orderBy(asc(rooms.floor), asc(rooms.name))
      .all();
  }
}
