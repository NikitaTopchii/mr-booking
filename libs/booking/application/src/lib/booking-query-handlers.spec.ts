import {
  RoomNotFoundError,
  ScheduleRangeValidationError,
  type BookingScheduleReader,
  type BookingScheduleRecord,
  type MyBookingsReader,
} from '@mr-booking/booking-domain';
import type { Room, RoomReader } from '@mr-booking/rooms-domain';
import {
  GetMyPastBookingsQuery,
  GetMyUpcomingBookingsQuery,
  GetRoomScheduleQuery,
} from './booking-queries';
import {
  GetMyPastBookingsHandler,
  GetMyUpcomingBookingsHandler,
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

  it('partitions upcoming and in-progress bookings using one server-clock value', async () => {
    const reader: MyBookingsReader = {
      findUpcoming: jest.fn(() => [
        {
          id: 'in-progress',
          title: 'Started',
          startsAtUtc: 900,
          endsAtUtc: 1_100,
          room: { id: 'room-a', name: 'A', floor: 1, capacity: 4 },
        },
        {
          id: 'upcoming',
          title: 'Next',
          startsAtUtc: 1_100,
          endsAtUtc: 1_200,
          room: { id: 'room-a', name: 'A', floor: 1, capacity: 4 },
        },
      ]),
      findPast: jest.fn(() => []),
    };
    const result = await new GetMyUpcomingBookingsHandler(reader, {
      now: () => 1_000,
    }).execute(new GetMyUpcomingBookingsQuery('user-alice'));

    expect(reader.findUpcoming).toHaveBeenCalledWith('user-alice', 1_000);
    expect(result).toEqual({
      serverNowUtc: 1_000,
      items: [
        expect.objectContaining({
          id: 'in-progress',
          status: 'IN_PROGRESS',
          canCancel: false,
        }),
        expect.objectContaining({
          id: 'upcoming',
          status: 'UPCOMING',
          canCancel: true,
        }),
      ],
    });
  });

  it('requests one extra past row and returns a stable next cursor', async () => {
    const records = ['c', 'b', 'a'].map((id, index) => ({
      id,
      title: id,
      startsAtUtc: 900 - index,
      endsAtUtc: 950 - index,
      room: { id: 'room-a', name: 'A', floor: 1, capacity: 4 },
    }));
    const reader: MyBookingsReader = {
      findUpcoming: jest.fn(() => []),
      findPast: jest.fn(() => records),
    };
    const result = await new GetMyPastBookingsHandler(reader, {
      now: () => 1_000,
    }).execute(new GetMyPastBookingsQuery('user-alice', null, 2));

    expect(reader.findPast).toHaveBeenCalledWith('user-alice', 1_000, null, 3);
    expect(result.items.map(({ id }) => id)).toEqual(['c', 'b']);
    expect(
      result.items.every(
        ({ status, canCancel }) => status === 'PAST' && !canCancel,
      ),
    ).toBe(true);
    expect(result.nextCursor).toEqual({
      startsAtUtc: 899,
      bookingId: 'b',
    });
  });
});
