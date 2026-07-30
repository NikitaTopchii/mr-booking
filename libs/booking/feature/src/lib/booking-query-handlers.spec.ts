import {
  RoomNotFoundError,
  ScheduleRangeValidationError,
  type BookingScheduleReader,
  type BookingScheduleRecord,
} from '@mr-booking/booking-domain';
import type { Room, RoomReader } from '@mr-booking/rooms-domain';
import { GetRoomScheduleQuery } from './booking-queries';
import {
  GetRoomsHandler,
  GetRoomScheduleHandler,
} from './booking-query-handlers';

const rooms: readonly Room[] = [
  { id: 'room-a', name: 'A', floor: 1, capacity: 4 },
];
const schedule: readonly BookingScheduleRecord[] = [
  {
    id: 'booking-alice',
    roomId: 'room-a',
    title: 'Mine',
    startsAtUtc: 2,
    endsAtUtc: 3,
    author: { id: 'user-alice', name: 'Alice' },
  },
  {
    id: 'booking-bob',
    roomId: 'room-a',
    title: 'Foreign',
    startsAtUtc: 3,
    endsAtUtc: 4,
    author: { id: 'user-bob', name: 'Bob' },
  },
];

describe('booking query handlers', () => {
  const roomReader: RoomReader = {
    exists: (roomId) => roomId === 'room-a',
    list: () => rooms,
  };
  const scheduleReader: BookingScheduleReader = {
    findActiveOverlappingRoomBookings: jest.fn(() => schedule),
  };

  it('returns the safe deterministic room catalogue', async () => {
    await expect(new GetRoomsHandler(roomReader).execute()).resolves.toBe(
      rooms,
    );
  });

  it('loads the requested overlap range and derives ownership', async () => {
    const result = await new GetRoomScheduleHandler(
      roomReader,
      scheduleReader,
    ).execute(new GetRoomScheduleQuery('user-alice', 'room-a', 1, 5));

    expect(
      scheduleReader.findActiveOverlappingRoomBookings,
    ).toHaveBeenCalledWith('room-a', 1, 5);
    expect(result).toEqual([
      expect.objectContaining({ id: 'booking-alice', isMine: true }),
      expect.objectContaining({ id: 'booking-bob', isMine: false }),
    ]);
  });

  it('rejects an invalid independent range before reading persistence', async () => {
    await expect(
      new GetRoomScheduleHandler(roomReader, scheduleReader).execute(
        new GetRoomScheduleQuery('user-alice', 'room-a', 5, 5),
      ),
    ).rejects.toBeInstanceOf(ScheduleRangeValidationError);
  });

  it('rejects an unknown room', async () => {
    await expect(
      new GetRoomScheduleHandler(roomReader, scheduleReader).execute(
        new GetRoomScheduleQuery('user-alice', 'missing', 1, 5),
      ),
    ).rejects.toBeInstanceOf(RoomNotFoundError);
  });
});
