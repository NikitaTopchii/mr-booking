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

  const upcomingResponse = await request.get('/api/bookings/mine/upcoming');
  expect(upcomingResponse.status()).toBe(200);
  const upcoming = (await upcomingResponse.json()) as {
    items: { id: string; startsAtUtc: string; endsAtUtc: string }[];
    serverNowUtc: string;
  };
  expect(upcoming.serverNowUtc).toMatch(/\.\d{3}Z$/u);
  expect(upcoming.items).toContainEqual(
    expect.objectContaining({
      id: created.booking.id,
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: endsAt.toISOString(),
    }),
  );

  const pastResponse = await request.get('/api/bookings/mine/past?limit=20');
  expect(pastResponse.status()).toBe(200);
  await expect(pastResponse.json()).resolves.toMatchObject({
    items: expect.any(Array),
    nextCursor: null,
    serverNowUtc: expect.stringMatching(/\.\d{3}Z$/u),
  });

  const timezoneLessResponse = await request.get(
    `/api/rooms/${roomId}/bookings?fromUtc=2030-06-03T09%3A00%3A00&toUtc=${encodeURIComponent(rangeEnd)}`,
  );
  expect(timezoneLessResponse.status()).toBe(400);
  await expect(timezoneLessResponse.json()).resolves.toEqual({
    code: 'VALIDATION_ERROR',
  });
});

test('booking API accepts four-hour and adjacent intervals but rejects 4.5 hours', async ({
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
  const rooms = (await roomsResponse.json()) as {
    rooms: { id: string }[];
  };
  const roomId = rooms.rooms.at(-1)?.id;
  if (!roomId) throw new Error('Expected a seeded room');

  const startsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(6, 0, 0, 0);
  const fourHourEnd = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
  const adjacentEnd = new Date(fourHourEnd.getTime() + 30 * 60 * 1000);

  const fourHourResponse = await request.post('/api/bookings', {
    data: {
      roomId,
      title: 'Four-hour API booking',
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: fourHourEnd.toISOString(),
    },
  });
  expect(fourHourResponse.status()).toBe(201);

  const adjacentResponse = await request.post('/api/bookings', {
    data: {
      roomId,
      title: 'Adjacent API booking',
      startsAtUtc: fourHourEnd.toISOString(),
      endsAtUtc: adjacentEnd.toISOString(),
    },
  });
  expect(adjacentResponse.status()).toBe(201);

  const tooLongResponse = await request.post('/api/bookings', {
    data: {
      roomId,
      title: 'Too long API booking',
      startsAtUtc: startsAt.toISOString(),
      endsAtUtc: new Date(
        startsAt.getTime() + 4.5 * 60 * 60 * 1000,
      ).toISOString(),
    },
  });
  expect(tooLongResponse.status()).toBe(400);
  await expect(tooLongResponse.json()).resolves.toEqual({
    code: 'BOOKING_INVALID_DURATION',
  });
});
