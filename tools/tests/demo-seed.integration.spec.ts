import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  Argon2PasswordHasher,
  seedAuthUsers,
  users,
} from '@mr-booking/auth-data-access';
import {
  bookingSlots,
  bookings,
  demoBookingIds,
  seedDemoBookings,
} from '@mr-booking/booking-data-access';
import {
  type DatabaseConnection,
  applyMigrations,
  openDatabase,
} from '@mr-booking/shared-database';
import { deterministicRooms, seedRooms } from '@mr-booking/rooms-data-access';
import { eq, notInArray } from 'drizzle-orm';

describe('complete deterministic demo seed', () => {
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
    const result = seedDemoBookings(connection, '2030-06-03');

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
      .where(eq(users.id, 'user-alice'))
      .get();
    const bob = connection.drizzle
      .select()
      .from(users)
      .where(eq(users.id, 'user-bob'))
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
        roomId === 'room-aquarium' &&
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
    seedDemoBookings(connection, '2030-06-03');

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
        roomId: 'room-kyiv',
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
          roomId: 'room-kyiv',
          slotStartsAtUtc: Date.parse('2031-01-06T07:00:00.000Z'),
        },
        {
          bookingId: 'user-created-booking',
          roomId: 'room-kyiv',
          slotStartsAtUtc: Date.parse('2031-01-06T07:30:00.000Z'),
        },
      ])
      .run();

    seedRooms(connection);
    await seedAuthUsers(connection, new Argon2PasswordHasher());
    seedDemoBookings(connection, '2030-06-03');

    expect(countRows(connection, 'rooms')).toBe(6);
    expect(countRows(connection, 'users')).toBe(3);
    expect(countRows(connection, 'bookings')).toBe(7);
    expect(countRows(connection, 'booking_slots')).toBe(17);

    const firstReferenceStarts = connection.drizzle
      .select({ id: bookings.id, startsAtUtc: bookings.startsAtUtc })
      .from(bookings)
      .where(notInArray(bookings.id, ['user-created-booking']))
      .orderBy(bookings.id)
      .all();

    seedDemoBookings(connection, '2030-06-10');

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
    .get() as { readonly count: number };
  return result.count;
}
