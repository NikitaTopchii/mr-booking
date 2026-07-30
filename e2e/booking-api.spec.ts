import { expect, test } from '@playwright/test';

test('booking API uses ISO 8601 timestamps through the gateway', async ({
  request,
}) => {
  const loginResponse = await request.post('/api/auth/login', {
    data: {
      email: 'alice@example.com',
      password: 'password123',
    },
  });
  expect(loginResponse.status()).toBe(200);

  const roomsResponse = await request.get('/api/rooms');
  expect(roomsResponse.status()).toBe(200);
  const rooms = (await roomsResponse.json()) as {
    rooms: { id: string }[];
  };
  const roomId = rooms.rooms[0]?.id;
  if (!roomId) {
    throw new Error('Gateway smoke requires at least one seeded room');
  }

  const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(12, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const title = `Gateway smoke ${Date.now()}`;
  const createResponse = await request.post('/api/bookings', {
    data: {
      roomId,
      title,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: endsAt.toISOString().replace('Z', '+00:00'),
    },
  });
  expect(createResponse.status()).toBe(201);
  const created = (await createResponse.json()) as {
    booking: {
      id: string;
      startsAtUtc: string;
      endsAtUtc: string;
    };
  };
  expect(created.booking).toMatchObject({
    startsAtUtc: startsAt.toISOString(),
    endsAtUtc: endsAt.toISOString(),
  });

  const rangeStart = new Date(startsAt.getTime() - 60 * 60 * 1000)
    .toISOString()
    .replace('Z', '+00:00');
  const rangeEnd = new Date(endsAt.getTime() + 60 * 60 * 1000).toISOString();
  const scheduleResponse = await request.get(
    `/api/rooms/${roomId}/bookings?fromUtc=${encodeURIComponent(rangeStart)}&toUtc=${encodeURIComponent(rangeEnd)}`,
  );
  expect(scheduleResponse.status()).toBe(200);
  const schedule = (await scheduleResponse.json()) as {
    bookings: {
      id: string;
      startsAtUtc: string;
      endsAtUtc: string;
    }[];
  };
  expect(schedule.bookings).toContainEqual(
    expect.objectContaining({
      id: created.booking.id,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: endsAt.toISOString(),
    }),
  );

  const timezoneLessResponse = await request.get(
    `/api/rooms/${roomId}/bookings?fromUtc=2030-06-03T09%3A00%3A00&toUtc=${encodeURIComponent(rangeEnd)}`,
  );
  expect(timezoneLessResponse.status()).toBe(400);
  await expect(timezoneLessResponse.json()).resolves.toEqual({
    code: 'VALIDATION_ERROR',
  });
});
