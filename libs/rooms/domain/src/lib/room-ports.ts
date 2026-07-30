export const ROOM_READER = Symbol('ROOM_READER');

export interface Room {
  readonly id: string;
  readonly name: string;
  readonly floor: number;
  readonly capacity: number;
}

export interface RoomReader {
  exists(roomId: string): boolean;
  list(): readonly Room[];
}
