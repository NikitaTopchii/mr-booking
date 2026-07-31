import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  Argon2PasswordHasher,
  seedAuthUsers,
  users,
} from '@mr-booking/auth-data-access';
import { DEMO_USER_IDS } from '@mr-booking/auth-domain';
import {
  DEMO_BOOKING_IDS,
  bookingSlots,
  bookings,
  demoBookingIds,
  seedDemoBookings,
} from '@mr-booking/booking-data-access';
import { DEMO_ROOM_IDS } from '@mr-booking/rooms-domain';
import {
  type DatabaseConnection,
  applyMigrations,
  openDatabase,
} from '@mr-booking/shared-database';
import { deterministicRooms, seedRooms } from '@mr-booking/rooms-data-access';
import { eq, notInArray } from 'drizzle-orm';

describe('complete deterministic demo seed', () => {
  const validationNowUtc = Date.parse('2029-01-01T00:00:00.000Z');
  let directory: string;
  let databasePath: string;
  let connection: DatabaseConnection;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mr-booking-demo-seed-'));
    databasePath = join(directory, 'demo.sqlite');
    connection = openDatabase(databasePath);
    applyMigrations(connection);
  });

  afterEach(() => {
    connection.close();
    rmSync(directory, { force: true, recursive: true });
  });

  it('creates valid rooms, users, bookings, and slots and survives reopening', async () => {
    const passwordHasher = new Argon2PasswordHasher();
    seedRooms(connection);
    await seedAuthUsers(connection, passwordHasher);
    const result = seedDemoBookings(connection, '2030-06-03', validationNowUtc);

    expect(result).toEqual({
      weekStart: '2030-06-03',
      bookingCount: 6,
      slotCount: 15,
    });
    expect(connection.drizzle.select().from(users).all()).toHaveLength(2);
    expect(connection.sqlite.prepare('SELECT * FROM rooms').all()).toHaveLength(
      deterministicRooms.length,
    );

    const alice = connection.drizzle
      .select()
      .from(users)
      .where(eq(users.id, DEMO_USER_IDS.alice))
      .get();
    const bob = connection.drizzle
      .select()
      .from(users)
      .where(eq(users.id, DEMO_USER_IDS.bob))
      .get();
    expect(
      alice && (await passwordHasher.verify(alice.passwordHash, 'password123')),
    ).toBe(true);
    expect(
      bob && (await passwordHasher.verify(bob.passwordHash, 'password123')),
    ).toBe(true);

    const seededBookings = connection.drizzle
      .select()
      .from(bookings)
      .orderBy(bookings.startsAtUtc)
      .all();
    const seededSlots = connection.drizzle
      .select()
      .from(bookingSlots)
      .orderBy(bookingSlots.slotStartsAtUtc)
      .all();
    expect(seededBookings.map(({ id }) => id).sort()).toEqual(
      [...demoBookingIds].sort(),
    );
    expect(seededSlots).toHaveLength(15);
    expect(
      new Set(
        seededSlots.map(
          ({ roomId, slotStartsAtUtc }) => `${roomId}:${slotStartsAtUtc}`,
        ),
      ).size,
    ).toBe(seededSlots.length);

    for (const booking of seededBookings) {
      const expectedSlotCount =
        (booking.endsAtUtc - booking.startsAtUtc) / (30 * 60 * 1_000);
      expect(
        seededSlots.filter(({ bookingId }) => bookingId === booking.id),
      ).toHaveLength(expectedSlotCount);
    }

    const adjacent = seededBookings.filter(
      ({ roomId, startsAtUtc }) =>
        roomId === DEMO_ROOM_IDS.aquarium &&
        startsAtUtc < Date.parse('2030-06-04T00:00:00.000Z'),
    );
    expect(adjacent).toHaveLength(2);
    expect(adjacent[0]?.endsAtUtc).toBe(adjacent[1]?.startsAtUtc);

    connection.close();
    connection = openDatabase(databasePath);
    expect(connection.drizzle.select().from(bookings).all()).toHaveLength(6);
    expect(connection.sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('is idempotent, preserves user records, and moves only known demos', async () => {
    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    seedDemoBookings(connection, '2030-06-03', validationNowUtc);

    connection.drizzle
      .insert(users)
      .values({
        id: 'user-created',
        name: 'User Created',
        email: 'created@example.com',
        normalizedEmail: 'created@example.com',
        passwordHash: '$argon2id$preserved',
        createdAtUtc: Date.UTC(2030, 0, 1),
      })
      .run();
    connection.drizzle
      .insert(bookings)
      .values({
        id: 'user-created-booking',
        roomId: DEMO_ROOM_IDS.kyiv,
        authorUserId: 'user-created',
        title: 'Preserved booking',
        startsAtUtc: Date.parse('2031-01-06T07:00:00.000Z'),
        endsAtUtc: Date.parse('2031-01-06T08:00:00.000Z'),
        createdAtUtc: Date.parse('2031-01-01T12:00:00.000Z'),
        cancelledAtUtc: null,
      })
      .run();
    connection.drizzle
      .insert(bookingSlots)
      .values([
        {
          bookingId: 'user-created-booking',
          roomId: DEMO_ROOM_IDS.kyiv,
          slotStartsAtUtc: Date.parse('2031-01-06T07:00:00.000Z'),
        },
        {
          bookingId: 'user-created-booking',
          roomId: DEMO_ROOM_IDS.kyiv,
          slotStartsAtUtc: Date.parse('2031-01-06T07:30:00.000Z'),
        },
      ])
      .run();

    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    const originalRowIds = readDemoBookingRowIds(connection);
    connection.sqlite
      .prepare(
        'UPDATE bookings SET title = ?, cancelled_at_utc = ? WHERE id = ?',
      )
      .run(
        'Changed demo title',
        validationNowUtc,
        DEMO_BOOKING_IDS.alicePlanning,
      );

    seedDemoBookings(connection, '2030-06-03', validationNowUtc);

    expect(countRows(connection, 'rooms')).toBe(6);
    expect(countRows(connection, 'users')).toBe(3);
    expect(countRows(connection, 'bookings')).toBe(7);
    expect(countRows(connection, 'booking_slots')).toBe(17);
    expect(readDemoBookingRowIds(connection)).toEqual(originalRowIds);
    expect(
      connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, DEMO_BOOKING_IDS.alicePlanning))
        .get(),
    ).toMatchObject({
      title: 'Weekly planning',
      cancelledAtUtc: null,
    });

    const firstReferenceStarts = connection.drizzle
      .select({ id: bookings.id, startsAtUtc: bookings.startsAtUtc })
      .from(bookings)
      .where(notInArray(bookings.id, ['user-created-booking']))
      .orderBy(bookings.id)
      .all();

    seedDemoBookings(connection, '2030-06-10', validationNowUtc);

    const secondReferenceStarts = connection.drizzle
      .select({ id: bookings.id, startsAtUtc: bookings.startsAtUtc })
      .from(bookings)
      .where(notInArray(bookings.id, ['user-created-booking']))
      .orderBy(bookings.id)
      .all();
    expect(secondReferenceStarts).toEqual(
      firstReferenceStarts.map((record) => ({
        ...record,
        startsAtUtc: record.startsAtUtc + 7 * 24 * 60 * 60 * 1_000,
      })),
    );
    expect(
      connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, 'user-created-booking'))
        .get(),
    ).toMatchObject({
      id: 'user-created-booking',
      title: 'Preserved booking',
    });
    expect(connection.sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('rolls back the complete plan when a user booking owns a target slot', async () => {
    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    seedDemoBookings(connection, '2030-06-03', validationNowUtc);
    const originalDemoBookings = connection.drizzle
      .select()
      .from(bookings)
      .where(eq(bookings.id, DEMO_BOOKING_IDS.alicePlanning))
      .all();
    const conflictingSlotStartsAtUtc = Date.parse('2030-06-10T07:00:00.000Z');

    connection.drizzle
      .insert(bookings)
      .values({
        id: 'user-created-conflict',
        roomId: DEMO_ROOM_IDS.aquarium,
        authorUserId: DEMO_USER_IDS.alice,
        title: 'User-owned target slot',
        startsAtUtc: conflictingSlotStartsAtUtc,
        endsAtUtc: conflictingSlotStartsAtUtc + 30 * 60 * 1_000,
        createdAtUtc: validationNowUtc,
        cancelledAtUtc: null,
      })
      .run();
    connection.drizzle
      .insert(bookingSlots)
      .values({
        bookingId: 'user-created-conflict',
        roomId: DEMO_ROOM_IDS.aquarium,
        slotStartsAtUtc: conflictingSlotStartsAtUtc,
      })
      .run();

    expect(() =>
      seedDemoBookings(connection, '2030-06-10', validationNowUtc),
    ).toThrow('Unable to persist the deterministic demo booking seed');
    expect(
      connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, DEMO_BOOKING_IDS.alicePlanning))
        .all(),
    ).toEqual(originalDemoBookings);
    expect(
      connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, 'user-created-conflict'))
        .get(),
    ).toMatchObject({ title: 'User-owned target slot' });
    expect(countDemoSlots(connection)).toBe(15);
    expect(countOrphanSlots(connection)).toBe(0);
    expect(connection.sqlite.pragma('foreign_key_check')).toEqual([]);
  });

  it('derives the next Kyiv Monday when no reference week is configured', async () => {
    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());

    expect(
      seedDemoBookings(
        connection,
        undefined,
        Date.parse('2026-07-30T20:00:00.000Z'),
      ).weekStart,
    ).toBe('2026-08-03');
  });
});

function countRows(
  connection: DatabaseConnection,
  tableName: 'rooms' | 'users' | 'bookings' | 'booking_slots',
): number {
  const result = connection.sqlite
    .prepare(`SELECT count(*) AS count FROM ${tableName}`)
    .get();
  return readCount(result);
}

function readDemoBookingRowIds(
  connection: DatabaseConnection,
): readonly number[] {
  const rows = connection.sqlite
    .prepare(
      `SELECT rowid FROM bookings WHERE id IN (${demoBookingIds
        .map(() => '?')
        .join(', ')}) ORDER BY id`,
    )
    .all(...demoBookingIds);

  return rows.map((row) => {
    if (
      typeof row !== 'object' ||
      row === null ||
      !('rowid' in row) ||
      typeof row.rowid !== 'number'
    ) {
      throw new Error('Expected a numeric booking rowid');
    }

    return row.rowid;
  });
}

function countDemoSlots(connection: DatabaseConnection): number {
  const result = connection.sqlite
    .prepare(
      `SELECT count(*) AS count FROM booking_slots WHERE booking_id IN (${demoBookingIds
        .map(() => '?')
        .join(', ')})`,
    )
    .get(...demoBookingIds);

  return readCount(result);
}

function countOrphanSlots(connection: DatabaseConnection): number {
  const result = connection.sqlite
    .prepare(
      `SELECT count(*) AS count
       FROM booking_slots AS slots
       LEFT JOIN bookings AS booking ON booking.id = slots.booking_id
       WHERE booking.id IS NULL`,
    )
    .get();

  return readCount(result);
}

function readCount(result: unknown): number {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('count' in result) ||
    typeof result.count !== 'number'
  ) {
    throw new Error('Expected a numeric row count');
  }

  return result.count;
}
