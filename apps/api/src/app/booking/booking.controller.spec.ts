import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { bookingSlots, bookings } from '@mr-booking/booking-data-access';
import { BOOKING_CLOCK, type BookingClock } from '@mr-booking/booking-domain';
import { deterministicRooms, seedRooms } from '@mr-booking/rooms-data-access';
import { DatabaseService } from '@mr-booking/shared-database';
import { eq } from 'drizzle-orm';
import type { SuperAgentTest } from 'supertest';
import request from 'supertest';
import { z } from 'zod';
import { AppModule } from '../app.module';
import type { InsertBookingInput } from './types/booking-controller-test.types';

const halfHour = 30 * 60 * 1000;
const hour = 2 * halfHour;
const day = 24 * hour;
const mondayOfficeOpeningUtc = Date.UTC(2030, 5, 3, 6);
const serverNowUtc = mondayOfficeOpeningUtc - day;

const roomSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  floor: z.number().int(),
  capacity: z.number().int().positive(),
});
const scheduleBookingSchema = z.strictObject({
  id: z.string(),
  roomId: z.string(),
  title: z.string(),
  startsAtUtc: z.iso
    .datetime()
    .refine((value) => new Date(value).toISOString() === value),
  endsAtUtc: z.iso
    .datetime()
    .refine((value) => new Date(value).toISOString() === value),
  author: z.strictObject({
    id: z.string(),
    name: z.string(),
  }),
  isMine: z.boolean(),
});
const myBookingSchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  startsAtUtc: z.iso
    .datetime()
    .refine((value) => new Date(value).toISOString() === value),
  endsAtUtc: z.iso
    .datetime()
    .refine((value) => new Date(value).toISOString() === value),
  room: roomSchema,
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'PAST']),
  canCancel: z.boolean(),
});
const myBookingsSchema = z.strictObject({
  items: z.array(myBookingSchema),
  serverNowUtc: z.iso
    .datetime()
    .refine((value) => new Date(value).toISOString() === value),
});
const myPastBookingsSchema = myBookingsSchema.extend({
  nextCursor: z.string().nullable(),
});

class MutableClock implements BookingClock {
  public constructor(public value: number) {}

  public now(): number {
    return this.value;
  }
}

describe('rooms and bookings API', () => {
  let application: INestApplication;
  let directory: string;
  let databaseService: DatabaseService;
  let alice: SuperAgentTest;
  let bob: SuperAgentTest;
  let aliceId: string;
  let bobId: string;
  const clock = new MutableClock(serverNowUtc);

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'mr-booking-api-booking-'));
    process.env['NODE_ENV'] = 'test';
    process.env['DATABASE_PATH'] = join(directory, 'api.sqlite');
    process.env['SEED_ON_START'] = 'false';
    process.env['SESSION_COOKIE_NAME'] = 'room_booking_session';
    process.env['SESSION_TTL_DAYS'] = '7';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BOOKING_CLOCK)
      .useValue(clock)
      .compile();
    application = module.createNestApplication();
    application.setGlobalPrefix('api');
    await application.init();
    databaseService = application.get(DatabaseService);
    seedRooms(databaseService.connection);

    alice = request.agent(application.getHttpServer());
    bob = request.agent(application.getHttpServer());
    aliceId = await register(alice, 'Alice', 'alice-booking@example.com');
    bobId = await register(bob, 'Bob', 'bob-booking@example.com');
  });

  afterAll(async () => {
    await application.close();
    rmSync(directory, { force: true, recursive: true });
  });

  describe('authentication', () => {
    it.each([
      ['rooms', () => request(application.getHttpServer()).get('/api/rooms')],
      [
        'schedule',
        () =>
          request(application.getHttpServer()).get(
            roomSchedulePath(
              'room-aquarium',
              mondayOfficeOpeningUtc,
              mondayOfficeOpeningUtc + hour,
            ),
          ),
      ],
      [
        'create',
        () =>
          request(application.getHttpServer())
            .post('/api/bookings')
            .send({
              roomId: 'room-aquarium',
              title: 'Anonymous',
              startsAtUtc: iso(mondayOfficeOpeningUtc),
              endsAtUtc: iso(mondayOfficeOpeningUtc + hour),
            }),
      ],
      [
        'cancel',
        () =>
          request(application.getHttpServer()).delete(
            '/api/bookings/unknown-booking',
          ),
      ],
      [
        'my upcoming bookings',
        () =>
          request(application.getHttpServer()).get(
            '/api/bookings/mine/upcoming',
          ),
      ],
      [
        'my past bookings',
        () =>
          request(application.getHttpServer()).get('/api/bookings/mine/past'),
      ],
    ])('rejects unauthenticated %s requests', async (_name, perform) => {
      await perform().expect(401).expect({ code: 'UNAUTHENTICATED' });
    });
  });

  describe('rooms', () => {
    it('returns deterministic safe room DTOs', async () => {
      const response = await alice.get('/api/rooms').expect(200);
      const parsed = z
        .strictObject({ rooms: z.array(roomSchema) })
        .parse(response.body);

      expect(parsed.rooms).toHaveLength(deterministicRooms.length);
      expect(parsed.rooms.map(({ id }) => id)).toEqual([
        'room-aquarium',
        'room-gagarin',
        'room-mars',
        'room-dnipro',
        'room-orbit',
        'room-kyiv',
      ]);
      expect(JSON.stringify(parsed)).not.toMatch(/created|metadata/iu);
    });
  });

  describe('room schedule', () => {
    const rangeStart = mondayOfficeOpeningUtc + 2 * hour;
    const rangeEnd = mondayOfficeOpeningUtc + 4 * hour;

    beforeAll(() => {
      insertBooking({
        id: 'schedule-containing',
        authorUserId: bobId,
        roomId: 'room-aquarium',
        title: 'Contains range',
        startsAtUtc: rangeStart - hour,
        endsAtUtc: rangeEnd + hour,
      });
      insertBooking({
        id: 'schedule-crosses-start',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Crosses start',
        startsAtUtc: rangeStart - halfHour,
        endsAtUtc: rangeStart + halfHour,
      });
      insertBooking({
        id: 'schedule-inside-z',
        authorUserId: bobId,
        roomId: 'room-aquarium',
        title: 'Inside Z',
        startsAtUtc: rangeStart + halfHour,
        endsAtUtc: rangeStart + hour,
      });
      insertBooking({
        id: 'schedule-inside-a',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Inside A',
        startsAtUtc: rangeStart + halfHour,
        endsAtUtc: rangeStart + hour,
      });
      insertBooking({
        id: 'schedule-crosses-end',
        authorUserId: bobId,
        roomId: 'room-aquarium',
        title: 'Crosses end',
        startsAtUtc: rangeEnd - halfHour,
        endsAtUtc: rangeEnd + halfHour,
      });
      insertBooking({
        id: 'schedule-adjacent-before',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Adjacent before',
        startsAtUtc: rangeStart - hour,
        endsAtUtc: rangeStart,
      });
      insertBooking({
        id: 'schedule-adjacent-after',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Adjacent after',
        startsAtUtc: rangeEnd,
        endsAtUtc: rangeEnd + hour,
      });
      insertBooking({
        id: 'schedule-cancelled',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Cancelled',
        startsAtUtc: rangeStart + hour,
        endsAtUtc: rangeStart + 2 * hour,
        cancelledAtUtc: serverNowUtc,
      });
      insertBooking({
        id: 'schedule-other-room',
        authorUserId: aliceId,
        roomId: 'room-mars',
        title: 'Other room',
        startsAtUtc: rangeStart,
        endsAtUtc: rangeStart + hour,
      });
    });

    it('returns an empty schedule for an existing room with no overlap', async () => {
      await alice
        .get(roomSchedulePath('room-kyiv', rangeStart, rangeEnd))
        .expect(200)
        .expect({ bookings: [] });
    });

    it('rejects an unknown room and invalid ranges', async () => {
      await alice
        .get(roomSchedulePath('missing', rangeStart, rangeEnd))
        .expect(404)
        .expect({ code: 'ROOM_NOT_FOUND' });
      await alice
        .get(roomSchedulePath('room-aquarium', rangeEnd, rangeStart))
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      await alice
        .get('/api/rooms/room-aquarium/bookings?fromUtc=nope')
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      await alice
        .get(
          `/api/rooms/room-aquarium/bookings?fromUtc=&toUtc=${encodeURIComponent(iso(rangeEnd))}`,
        )
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      await alice
        .get(
          `/api/rooms/room-aquarium/bookings?fromUtc=${encodeURIComponent('2030-06-03T08:00:00')}&toUtc=${encodeURIComponent(iso(rangeEnd))}`,
        )
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
    });

    it('uses half-open overlap semantics, safe authorship, and deterministic ordering', async () => {
      const response = await alice
        .get(
          roomSchedulePath(
            'room-aquarium',
            explicitOffsetIso(rangeStart, 180),
            explicitOffsetIso(rangeEnd, 180),
          ),
        )
        .expect(200);
      const parsed = z
        .strictObject({ bookings: z.array(scheduleBookingSchema) })
        .parse(response.body);

      expect(parsed.bookings.map(({ id }) => id)).toEqual([
        'schedule-containing',
        'schedule-crosses-start',
        'schedule-inside-a',
        'schedule-inside-z',
        'schedule-crosses-end',
      ]);
      expect(
        parsed.bookings.find(({ id }) => id === 'schedule-crosses-start'),
      ).toMatchObject({
        author: { id: aliceId, name: 'Alice' },
        isMine: true,
      });
      expect(
        parsed.bookings.find(({ id }) => id === 'schedule-containing'),
      ).toMatchObject({
        author: { id: bobId, name: 'Bob' },
        isMine: false,
      });
      expect(JSON.stringify(parsed)).not.toMatch(/email|password|session/iu);
    });
  });

  describe('create booking', () => {
    const createStart = mondayOfficeOpeningUtc + 10 * day;

    it('creates a safe booking for the authenticated author', async () => {
      const response = await alice
        .post('/api/bookings')
        .send(validBookingInput(createStart, '  Planning  '))
        .expect(201);
      const parsed = z
        .strictObject({ booking: scheduleBookingSchema })
        .parse(response.body);

      expect(parsed.booking).toMatchObject({
        roomId: 'room-aquarium',
        title: 'Planning',
        startsAtUtc: iso(createStart),
        endsAtUtc: iso(createStart + hour),
        author: { id: aliceId, name: 'Alice' },
        isMine: true,
      });
      expect(JSON.stringify(parsed)).not.toMatch(
        /created|cancelled|email|password|slot/iu,
      );

      const persisted = databaseService.connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, parsed.booking.id))
        .get();
      expect(persisted?.authorUserId).toBe(aliceId);
    });

    it('normalizes explicit-offset input to canonical UTC output and internal milliseconds', async () => {
      const startsAtUtc = createStart + day;
      const response = await alice
        .post('/api/bookings')
        .send({
          ...validBookingInput(startsAtUtc, 'Offset input'),
          startsAtUtc: explicitOffsetIso(startsAtUtc, 180),
          endsAtUtc: explicitOffsetIso(startsAtUtc + hour, 180),
        })
        .expect(201);
      const parsed = z
        .strictObject({ booking: scheduleBookingSchema })
        .parse(response.body);

      expect(parsed.booking).toMatchObject({
        startsAtUtc: iso(startsAtUtc),
        endsAtUtc: iso(startsAtUtc + hour),
      });
      expect(
        databaseService.connection.drizzle
          .select()
          .from(bookings)
          .where(eq(bookings.id, parsed.booking.id))
          .get(),
      ).toMatchObject({
        startsAtUtc,
        endsAtUtc: startsAtUtc + hour,
      });
    });

    it.each([
      [
        'timezone-less strings',
        {
          ...validBookingInput(createStart + 2 * day),
          startsAtUtc: '2030-06-15T09:00:00',
        },
      ],
      [
        'numeric timestamps',
        {
          ...validBookingInput(createStart + 2 * day),
          startsAtUtc: createStart + 2 * day,
        },
      ],
    ])('rejects %s at the transport boundary', async (_name, input) => {
      await alice
        .post('/api/bookings')
        .send(input)
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
    });

    it('rejects client-controlled authorship and ownership fields', async () => {
      const before = databaseService.connection.drizzle
        .select()
        .from(bookings)
        .all().length;

      await alice
        .post('/api/bookings')
        .send({
          ...validBookingInput(createStart + day, 'Override attempt'),
          authorUserId: bobId,
          isMine: false,
        })
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });

      expect(
        databaseService.connection.drizzle.select().from(bookings).all(),
      ).toHaveLength(before);
    });

    it.each([
      [
        'required title',
        validBookingInput(createStart + 2 * day, '   '),
        'BOOKING_TITLE_REQUIRED',
      ],
      [
        'title length',
        validBookingInput(createStart + 2 * day, 'x'.repeat(101)),
        'BOOKING_TITLE_TOO_LONG',
      ],
      [
        'invalid interval',
        {
          ...validBookingInput(createStart + 2 * day),
          endsAtUtc: iso(createStart + 2 * day),
        },
        'BOOKING_INVALID_INTERVAL',
      ],
      [
        'past start',
        validBookingInput(serverNowUtc, 'Past'),
        'BOOKING_START_NOT_IN_FUTURE',
      ],
      [
        'duration',
        {
          ...validBookingInput(createStart + 2 * day),
          endsAtUtc: iso(createStart + 2 * day + 15 * 60 * 1000),
        },
        'BOOKING_INVALID_DURATION',
      ],
      [
        'slot alignment',
        {
          ...validBookingInput(createStart + 2 * day),
          startsAtUtc: iso(createStart + 2 * day + 5 * 60 * 1000),
          endsAtUtc: iso(createStart + 2 * day + hour + 5 * 60 * 1000),
        },
        'BOOKING_SLOT_ALIGNMENT',
      ],
      [
        'office hours',
        {
          ...validBookingInput(createStart + 2 * day),
          startsAtUtc: iso(createStart + 2 * day - halfHour),
          endsAtUtc: iso(createStart + 2 * day),
        },
        'BOOKING_OUTSIDE_OFFICE_HOURS',
      ],
      [
        'unknown room',
        {
          ...validBookingInput(createStart + 2 * day),
          roomId: 'missing-room',
        },
        'ROOM_NOT_FOUND',
      ],
    ])('maps %s errors', async (_name, input, code) => {
      const status = code === 'ROOM_NOT_FOUND' ? 404 : 400;
      await alice
        .post('/api/bookings')
        .send(input)
        .expect(status)
        .expect({ code });
    });

    it('maps overlapping and concurrent slot conflicts to 409', async () => {
      const overlapStart = createStart + 3 * day + hour;
      await alice
        .post('/api/bookings')
        .send(validBookingInput(overlapStart, 'Winner'))
        .expect(201);
      await bob
        .post('/api/bookings')
        .send(validBookingInput(overlapStart - halfHour, 'Crosses start'))
        .expect(409)
        .expect({ code: 'BOOKING_CONFLICT' });
      await bob
        .post('/api/bookings')
        .send(validBookingInput(overlapStart + halfHour, 'Overlap'))
        .expect(409)
        .expect({ code: 'BOOKING_CONFLICT' });

      const concurrentStart = createStart + 4 * day;
      const attempts = await Promise.all([
        alice
          .post('/api/bookings')
          .send(validBookingInput(concurrentStart, 'Alice attempt')),
        bob
          .post('/api/bookings')
          .send(validBookingInput(concurrentStart, 'Bob attempt')),
      ]);

      expect(attempts.map(({ status }) => status).sort()).toEqual([201, 409]);
      expect(attempts.find(({ status }) => status === 409)?.body).toEqual({
        code: 'BOOKING_CONFLICT',
      });
    });
  });

  describe('personal bookings', () => {
    let charlie: SuperAgentTest;
    let charlieId: string;

    beforeAll(async () => {
      charlie = request.agent(application.getHttpServer());
      charlieId = await register(
        charlie,
        'Charlie',
        'charlie-booking@example.com',
      );
      [
        {
          id: 'mine-ongoing',
          startsAtUtc: serverNowUtc - halfHour,
          endsAtUtc: serverNowUtc + halfHour,
          title: 'Ongoing',
        },
        {
          id: 'mine-upcoming-b',
          startsAtUtc: serverNowUtc + 2 * hour,
          endsAtUtc: serverNowUtc + 3 * hour,
          title: 'Upcoming B',
        },
        {
          id: 'mine-upcoming-a',
          startsAtUtc: serverNowUtc + 2 * hour,
          endsAtUtc: serverNowUtc + 3 * hour,
          title: 'Upcoming A',
        },
        {
          id: 'mine-past-c',
          startsAtUtc: serverNowUtc - 4 * hour,
          endsAtUtc: serverNowUtc - 3 * hour,
          title: 'Past C',
        },
        {
          id: 'mine-past-b',
          startsAtUtc: serverNowUtc - 4 * hour,
          endsAtUtc: serverNowUtc - 3 * hour,
          title: 'Past B',
        },
        {
          id: 'mine-past-a',
          startsAtUtc: serverNowUtc - 6 * hour,
          endsAtUtc: serverNowUtc - 5 * hour,
          title: 'Past A',
        },
      ].forEach((record) =>
        insertBooking({
          ...record,
          authorUserId: charlieId,
          roomId: 'room-mars',
        }),
      );
      insertBooking({
        id: 'mine-cancelled',
        authorUserId: charlieId,
        roomId: 'room-mars',
        title: 'Cancelled',
        startsAtUtc: serverNowUtc + 5 * hour,
        endsAtUtc: serverNowUtc + 6 * hour,
        cancelledAtUtc: serverNowUtc - hour,
      });
    });

    it('returns upcoming and in-progress rows with safe room metadata and server-derived cancellation state', async () => {
      const response = await charlie
        .get('/api/bookings/mine/upcoming')
        .expect(200)
        .expect('Cache-Control', 'private, no-store');
      const parsed = myBookingsSchema.parse(response.body);

      expect(parsed.serverNowUtc).toBe(iso(serverNowUtc));
      expect(parsed.items.map(({ id }) => id)).toEqual([
        'mine-ongoing',
        'mine-upcoming-a',
        'mine-upcoming-b',
      ]);
      expect(parsed.items[0]).toEqual(
        expect.objectContaining({
          status: 'IN_PROGRESS',
          canCancel: false,
          room: expect.objectContaining({
            id: 'room-mars',
            name: expect.any(String),
            floor: 2,
            capacity: 6,
          }),
        }),
      );
      expect(parsed.items[1]).toEqual(
        expect.objectContaining({ status: 'UPCOMING', canCancel: true }),
      );
      expect(JSON.stringify(parsed)).not.toMatch(
        /author|cancelledAt|createdAt/,
      );
    });

    it('paginates past rows with an opaque stable cursor and rejects malformed pagination', async () => {
      const firstResponse = await charlie
        .get('/api/bookings/mine/past?limit=2')
        .expect(200);
      const first = myPastBookingsSchema.parse(firstResponse.body);
      expect(first.items.map(({ id }) => id)).toEqual([
        'mine-past-c',
        'mine-past-b',
      ]);
      expect(
        first.items.every(
          ({ status, canCancel }) => status === 'PAST' && !canCancel,
        ),
      ).toBe(true);
      expect(first.nextCursor).toEqual(expect.any(String));

      const secondResponse = await charlie
        .get(
          `/api/bookings/mine/past?limit=2&cursor=${encodeURIComponent(first.nextCursor ?? '')}`,
        )
        .expect(200);
      const second = myPastBookingsSchema.parse(secondResponse.body);
      expect(second.items.map(({ id }) => id)).toEqual(['mine-past-a']);
      expect(second.nextCursor).toBeNull();

      await charlie
        .get('/api/bookings/mine/past?limit=0')
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      await charlie
        .get('/api/bookings/mine/past?limit=51')
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      await charlie
        .get('/api/bookings/mine/past?cursor=not-a-cursor')
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
      const cursor = first.nextCursor ?? '';
      const tamperedCursor = `${cursor.slice(0, -1)}${
        cursor.endsWith('A') ? 'B' : 'A'
      }`;
      await charlie
        .get(
          `/api/bookings/mine/past?cursor=${encodeURIComponent(tamperedCursor)}`,
        )
        .expect(400)
        .expect({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('cancellation', () => {
    const cancellationStart = mondayOfficeOpeningUtc + 20 * day;

    it('lets the owner cancel idempotently, releases slots, and removes only that booking from the schedule', async () => {
      const owned = await createBooking(alice, cancellationStart, 'Cancel me');
      const unaffected = await createBooking(
        bob,
        cancellationStart + 2 * hour,
        'Keep me',
      );

      await bob
        .delete(`/api/bookings/${owned.id}`)
        .expect(403)
        .expect({ code: 'BOOKING_CANCELLATION_FORBIDDEN' });
      await alice.delete(`/api/bookings/${owned.id}`).expect(204);
      await alice.delete(`/api/bookings/${owned.id}`).expect(204);

      expect(
        databaseService.connection.drizzle
          .select()
          .from(bookingSlots)
          .where(eq(bookingSlots.bookingId, owned.id))
          .all(),
      ).toHaveLength(0);

      const schedule = await alice
        .get(
          roomSchedulePath(
            'room-aquarium',
            cancellationStart,
            cancellationStart + 4 * hour,
          ),
        )
        .expect(200);
      expect(
        z
          .strictObject({ bookings: z.array(scheduleBookingSchema) })
          .parse(schedule.body)
          .bookings.map(({ id }) => id),
      ).toEqual([unaffected.id]);

      await alice
        .post('/api/bookings')
        .send(validBookingInput(cancellationStart, 'Replacement'))
        .expect(201);
    });

    it('maps unknown and started bookings without exposing records', async () => {
      await alice
        .delete('/api/bookings/missing-booking')
        .expect(404)
        .expect({ code: 'BOOKING_NOT_FOUND' });

      insertBooking({
        id: 'already-started',
        authorUserId: aliceId,
        roomId: 'room-aquarium',
        title: 'Already started',
        startsAtUtc: serverNowUtc - hour,
        endsAtUtc: serverNowUtc + hour,
      });
      await alice
        .delete('/api/bookings/already-started')
        .expect(409)
        .expect({ code: 'BOOKING_NOT_CANCELLABLE' });
    });
  });

  async function register(
    agent: SuperAgentTest,
    name: string,
    email: string,
  ): Promise<string> {
    const response = await agent
      .post('/api/auth/register')
      .send({ name, email, password: 'password123' })
      .expect(201);
    const registration = z
      .strictObject({
        user: z.strictObject({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          emailVerified: z.boolean(),
        }),
        emailVerification: z.strictObject({
          status: z.literal('sent'),
          code: z.literal('EMAIL_VERIFICATION_SENT'),
          expiresAtUtc: z.string(),
          retryAfterSeconds: z.number().int().positive(),
          developmentVerificationUrl: z.string().url(),
        }),
      })
      .parse(response.body);
    const verificationUrl =
      registration.emailVerification.developmentVerificationUrl;
    const token = new URL(verificationUrl).searchParams.get('token');
    if (!token) throw new Error('Expected a development verification token');
    await agent
      .post('/api/auth/email-verification/verify')
      .send({ token })
      .expect(200, { code: 'EMAIL_VERIFIED' });
    return registration.user.id;
  }

  function insertBooking(input: InsertBookingInput): void {
    databaseService.connection.drizzle
      .insert(bookings)
      .values({
        ...input,
        createdAtUtc: serverNowUtc,
        cancelledAtUtc: input.cancelledAtUtc ?? null,
      })
      .run();
  }

  async function createBooking(
    agent: SuperAgentTest,
    startsAtUtc: number,
    title: string,
  ): Promise<z.output<typeof scheduleBookingSchema>> {
    const response = await agent
      .post('/api/bookings')
      .send(validBookingInput(startsAtUtc, title))
      .expect(201);
    return z
      .strictObject({ booking: scheduleBookingSchema })
      .parse(response.body).booking;
  }
});

function validBookingInput(startsAtUtc: number, title = 'Planning') {
  return {
    roomId: 'room-aquarium',
    title,
    startsAtUtc: iso(startsAtUtc),
    endsAtUtc: iso(startsAtUtc + hour),
  };
}

function roomSchedulePath(
  roomId: string,
  fromUtc: number | string,
  toUtc: number | string,
): string {
  const from = typeof fromUtc === 'number' ? iso(fromUtc) : fromUtc;
  const to = typeof toUtc === 'number' ? iso(toUtc) : toUtc;

  return `/api/rooms/${roomId}/bookings?fromUtc=${encodeURIComponent(from)}&toUtc=${encodeURIComponent(to)}`;
}

function iso(epochMilliseconds: number): string {
  return new Date(epochMilliseconds).toISOString();
}

function explicitOffsetIso(
  epochMilliseconds: number,
  offsetMinutes: number,
): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const minutes = String(absoluteOffset % 60).padStart(2, '0');
  const localDateTime = new Date(epochMilliseconds + offsetMinutes * 60 * 1000)
    .toISOString()
    .slice(0, -1);

  return `${localDateTime}${sign}${hours}:${minutes}`;
}
