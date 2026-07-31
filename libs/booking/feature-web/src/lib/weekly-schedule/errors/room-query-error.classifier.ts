import type { RoomQueryErrorCode } from './room-query-error.catalog';

export function classifyRoomQueryError(cause: unknown): RoomQueryErrorCode {
  void cause;
  return 'service';
}
