import {
  BookingClientError,
  cancelBooking,
  createBooking,
  fetchMyPastBookingsPage,
  isScheduleKeyForRoom,
  listMyPastBookings,
  listMyUpcomingBookings,
  listRoomBookings,
  listRooms,
} from './booking-client';

const booking = {
  id: 'booking-1',
  roomId: 'room-1',
  title: 'Planning',
  startsAtUtc: '2030-06-03T07:00:00.000Z',
  endsAtUtc: '2030-06-03T07:30:00.000Z',
  author: { id: 'user-1', name: 'Alice' },
  isMine: true,
};

describe('booking browser client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('parses rooms and sends same-origin credentials', async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          rooms: [{ id: 'room-1', name: 'Aquarium', floor: 1, capacity: 4 }],
        }),
      ),
    );

    await expect(listRooms()).resolves.toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('/api/rooms', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
  });

  it('uses encoded ISO 8601 schedule query parameters', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue(new Response(JSON.stringify({ bookings: [booking] })));

    await listRoomBookings('room/1', {
      fromUtc: '2030-06-03T07:00:00.000Z',
      toUtc: '2030-06-10T07:00:00.000Z',
    });

    expect(jest.mocked(fetch).mock.calls[0]?.[0]).toBe(
      '/api/rooms/room%2F1/bookings?fromUtc=2030-06-03T07%3A00%3A00.000Z&toUtc=2030-06-10T07%3A00%3A00.000Z',
    );
  });

  it('serializes create timestamps as provided absolute strings', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue(new Response(JSON.stringify({ booking })));

    await createBooking({
      roomId: 'room-1',
      title: 'Planning',
      startsAtUtc: booking.startsAtUtc,
      endsAtUtc: booking.endsAtUtc,
    });

    expect(
      JSON.parse(String(jest.mocked(fetch).mock.calls[0]?.[1]?.body)),
    ).toEqual({
      roomId: 'room-1',
      title: 'Planning',
      startsAtUtc: booking.startsAtUtc,
      endsAtUtc: booking.endsAtUtc,
    });
  });

  it('rejects malformed server DTOs and naive client timestamps', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ rooms: [{}] })));

    await expect(listRooms()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    await expect(
      listRoomBookings('room-1', {
        fromUtc: '2030-06-03T07:00:00',
        toUtc: '2030-06-10T07:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BookingClientError);
  });

  it('normalizes API errors and cancellation', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'BOOKING_CONFLICT' }), {
          status: 409,
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(
      createBooking({
        roomId: 'room-1',
        title: 'Planning',
        startsAtUtc: booking.startsAtUtc,
        endsAtUtc: booking.endsAtUtc,
      }),
    ).rejects.toMatchObject({ code: 'BOOKING_CONFLICT', status: 409 });
    await expect(cancelBooking('booking/1')).resolves.toBeUndefined();
  });

  it('runtime-validates personal booking pages and encodes opaque cursors', async () => {
    const item = {
      id: 'booking-1',
      title: 'Planning',
      startsAtUtc: booking.startsAtUtc,
      endsAtUtc: booking.endsAtUtc,
      room: { id: 'room-1', name: 'Aquarium', floor: 1, capacity: 4 },
      status: 'UPCOMING',
      canCancel: true,
    };
    jest
      .mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [item],
            serverNowUtc: '2030-06-03T06:00:00.000Z',
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ ...item, status: 'PAST', canCancel: false }],
            serverNowUtc: '2030-06-03T09:00:00.000Z',
            nextCursor: null,
          }),
        ),
      );

    await expect(listMyUpcomingBookings()).resolves.toMatchObject({
      items: [{ id: 'booking-1', status: 'UPCOMING' }],
    });
    await expect(listMyPastBookings('cursor/value', 10)).resolves.toMatchObject(
      { nextCursor: null },
    );
    expect(jest.mocked(fetch).mock.calls[1]?.[0]).toBe(
      '/api/bookings/mine/past?limit=10&cursor=cursor%2Fvalue',
    );
  });

  it('fetches a past page through the typed SWR key contract', async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          serverNowUtc: '2030-06-03T09:00:00.000Z',
          nextCursor: null,
        }),
      ),
    );

    await fetchMyPastBookingsPage([
      'booking',
      'mine',
      'past',
      'opaque/cursor',
      12,
    ]);

    expect(jest.mocked(fetch).mock.calls[0]?.[0]).toBe(
      '/api/bookings/mine/past?limit=12&cursor=opaque%2Fcursor',
    );
  });

  it('rejects noncanonical personal response timestamps and identifies affected schedule keys', async () => {
    jest.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          serverNowUtc: '2030-06-03T08:00:00+02:00',
        }),
      ),
    );

    await expect(listMyUpcomingBookings()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
    expect(
      isScheduleKeyForRoom(
        [
          'booking',
          'schedule',
          'room-1',
          '2030-06-03T00:00:00.000Z',
          '2030-06-10T00:00:00.000Z',
        ],
        'room-1',
      ),
    ).toBe(true);
    expect(isScheduleKeyForRoom(['booking', 'mine'], 'room-1')).toBe(false);
  });
});
