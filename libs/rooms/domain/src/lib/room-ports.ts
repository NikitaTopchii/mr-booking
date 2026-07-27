export const ROOM_READER = Symbol('ROOM_READER');

export interface RoomReader {
  exists(roomId: string): boolean;
}
