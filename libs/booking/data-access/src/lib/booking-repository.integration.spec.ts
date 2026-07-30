import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { users } from '@mr-booking/auth-infrastructure';
import { BookingConflictError, type Booking } from '@mr-booking/booking-domain';
import { rooms } from '@mr-booking/rooms-infrastructure';
import {
  applyMigrations,
  type DatabaseConnection,
  openDatabase,
} from '@mr-booking/shared-database';
import { eq, sql } from 'drizzle-orm';
import {
  DrizzleBookingRepository,
  DrizzleMyBookingsReader,
} from './booking-repository';
import { bookingSlots, bookings } from './booking-schema';
import type { ConcurrentBookingResult } from './types/booking-repository-test.types';

jest.setTimeout(15_000);

const startsAtUtc = Date.UTC(2026, 0, 10, 7);
const slotMilliseconds = 30 * 60 * 1000;

describe('Drizzle booking persistence', () => {
  let temporaryDirectory: string;
  let databasePath: string;
  let connection: DatabaseConnection;
  let repository: DrizzleBookingRepository;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'mr-booking-bookings-'));
    databasePath = join(temporaryDirectory, 'bookings.sqlite');
    connection = openDatabase(databasePath);
    applyMigrations(connection);
    seedRequiredRecords(connection);
    repository = new DrizzleBookingRepository({ connection });
  });

  afterEach(() => {
    connection.close();
    rmSync(temporaryDirectory, { force: true, recursive: true });
  });

  it('applies the booking migration through the normal runner repeatedly', () => {
    applyMigrations(connection);

    const tableNames = connection.sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('bookings', 'booking_slots') ORDER BY name",
      )
      .all();
    const migrationCount = connection.sqlite
      .prepare('SELECT COUNT(*) AS count FROM __drizzle_migrations')
      .get();

    expect(tableNames).toEqual([
      { name: 'booking_slots' },
      { name: 'bookings' },
    ]);
    expect(migrationCount).toEqual({ count: 3 });
  });

  it('enforces room and author foreign keys', () => {
    expect(() =>
      insertBookingRecord(
        connection,
        bookingRecord('missing-room', { roomId: 'missing-room' }),
      ),
    ).toThrow();
    expect(() =>
      insertBookingRecord(
        connection,
        bookingRecord('missing-user', { authorUserId: 'missing-user' }),
      ),
    ).toThrow();
  });

  it.each([
    ['   ', startsAtUtc, startsAtUtc + slotMilliseconds],
    ['x'.repeat(101), startsAtUtc, startsAtUtc + slotMilliseconds],
    ['Valid', startsAtUtc, startsAtUtc],
    ['Valid', startsAtUtc, startsAtUtc + slotMilliseconds - 1],
    ['Valid', startsAtUtc, startsAtUtc + 4 * 60 * 60 * 1000 + slotMilliseconds],
    ['Valid', startsAtUtc, startsAtUtc + 45 * 60 * 1000],
  ])('enforces booking CHECK constraints', (title, start, end) => {
    expect(() =>
      insertBookingRecord(
        connection,
        bookingRecord(`invalid-${end}`, {
          title,
          startsAtUtc: start,
          endsAtUtc: end,
        }),
      ),
    ).toThrow();
  });

  it('creates one booking and every occupied slot atomically', () => {
    const booking = bookingRecord('booking-1');

    createBooking(repository, booking);

    expect(connection.drizzle.select().from(bookings).all()).toEqual([booking]);
    expect(
      connection.drizzle
        .select()
        .from(bookingSlots)
        .orderBy(bookingSlots.slotStartsAtUtc)
        .all(),
    ).toEqual([
      {
        bookingId: booking.id,
        roomId: booking.roomId,
        slotStartsAtUtc: startsAtUtc,
      },
      {
        bookingId: booking.id,
        roomId: booking.roomId,
        slotStartsAtUtc: startsAtUtc + slotMilliseconds,
      },
    ]);
  });

  it('maps only room-slot uniqueness to conflict and rolls back the losing booking', () => {
    createBooking(repository, bookingRecord('winner'));

    expect(() => createBooking(repository, bookingRecord('loser'))).toThrow(
      BookingConflictError,
    );

    expect(countRows(connection, bookings)).toBe(1);
    expect(countRows(connection, bookingSlots)).toBe(2);
    expect(
      connection.drizzle
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.id, 'loser'))
        .get(),
    ).toBeUndefined();
  });

  it('does not misclassify another database constraint as a booking conflict', () => {
    let thrown: unknown;

    try {
      createBooking(
        repository,
        bookingRecord('invalid-author', {
          authorUserId: 'missing-user',
        }),
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(thrown).not.toBeInstanceOf(BookingConflictError);
    expect(countRows(connection, bookings)).toBe(0);
    expect(countRows(connection, bookingSlots)).toBe(0);
  });

  it('allows the same slot in different rooms and adjacent slots in one room', () => {
    createBooking(repository, bookingRecord('room-a'));
    createBooking(repository, bookingRecord('room-b', { roomId: 'room-mars' }));
    createBooking(
      repository,
      bookingRecord('adjacent', {
        startsAtUtc: startsAtUtc + 2 * slotMilliseconds,
        endsAtUtc: startsAtUtc + 4 * slotMilliseconds,
      }),
    );

    expect(countRows(connection, bookings)).toBe(3);
    expect(countRows(connection, bookingSlots)).toBe(6);
  });

  it('cancels without deleting the booking, releases its slots, and preserves other bookings', () => {
    const cancelled = bookingRecord('cancelled');
    const unaffected = bookingRecord('unaffected', {
      roomId: 'room-mars',
    });
    createBooking(repository, cancelled);
    createBooking(repository, unaffected);
    const cancelledAtUtc = Date.UTC(2026, 0, 5);

    repository.withImmediateTransaction((transaction) => {
      transaction.cancelBookingAndReleaseSlots(cancelled.id, cancelledAtUtc);
    });

    expect(
      connection.drizzle
        .select()
        .from(bookings)
        .where(eq(bookings.id, cancelled.id))
        .get(),
    ).toEqual({ ...cancelled, cancelledAtUtc });
    expect(
      connection.drizzle
        .select()
        .from(bookingSlots)
        .where(eq(bookingSlots.bookingId, cancelled.id))
        .all(),
    ).toEqual([]);
    expect(
      connection.drizzle
        .select()
        .from(bookingSlots)
        .where(eq(bookingSlots.bookingId, unaffected.id))
        .all(),
    ).toHaveLength(2);
    expect(() =>
      createBooking(repository, bookingRecord('replacement')),
    ).not.toThrow();
  });

  it('rolls back the cancellation timestamp when slot release fails', () => {
    const booking = bookingRecord('rollback-cancellation');
    createBooking(repository, booking);
    connection.sqlite.exec(`
      CREATE TRIGGER reject_booking_slot_delete
      BEFORE DELETE ON booking_slots
      BEGIN
        SELECT RAISE(ABORT, 'slot release failed');
      END
    `);

    expect(() =>
      repository.withImmediateTransaction((transaction) => {
        transaction.cancelBookingAndReleaseSlots(
          booking.id,
          Date.UTC(2026, 0, 5),
        );
      }),
    ).toThrow();

    expect(
      connection.drizzle
        .select({ cancelledAtUtc: bookings.cancelledAtUtc })
        .from(bookings)
        .where(eq(bookings.id, booking.id))
        .get(),
    ).toEqual({ cancelledAtUtc: null });
    expect(
      connection.drizzle
        .select()
        .from(bookingSlots)
        .where(eq(bookingSlots.bookingId, booking.id))
        .all(),
    ).toHaveLength(2);
  });

  it('persists booking and slots after reopening the file-backed database', () => {
    createBooking(repository, bookingRecord('persistent'));
    connection.close();

    connection = openDatabase(databasePath);
    applyMigrations(connection);

    expect(countRows(connection, bookings)).toBe(1);
    expect(countRows(connection, bookingSlots)).toBe(2);
  });

  it('reads only the owner active non-past bookings in nearest-first stable order', () => {
    const reader = new DrizzleMyBookingsReader({ connection });
    const now = startsAtUtc;
    [
      bookingRecord('upcoming-b', {
        startsAtUtc: now + slotMilliseconds,
        endsAtUtc: now + 2 * slotMilliseconds,
      }),
      bookingRecord('upcoming-a', {
        startsAtUtc: now + slotMilliseconds,
        endsAtUtc: now + 2 * slotMilliseconds,
        roomId: 'room-mars',
      }),
      bookingRecord('ongoing', {
        startsAtUtc: now - slotMilliseconds,
        endsAtUtc: now + slotMilliseconds,
      }),
      bookingRecord('ended', {
        startsAtUtc: now - 2 * slotMilliseconds,
        endsAtUtc: now,
      }),
      bookingRecord('cancelled-upcoming', {
        startsAtUtc: now + 3 * slotMilliseconds,
        endsAtUtc: now + 4 * slotMilliseconds,
        cancelledAtUtc: now - slotMilliseconds,
      }),
      bookingRecord('foreign-upcoming', {
        authorUserId: 'user-bob',
        startsAtUtc: now + 4 * slotMilliseconds,
        endsAtUtc: now + 5 * slotMilliseconds,
      }),
    ].forEach((record) => insertBookingRecord(connection, record));

    const result = reader.findUpcoming('user-alice', now);

    expect(result.map(({ id }) => id)).toEqual([
      'ongoing',
      'upcoming-a',
      'upcoming-b',
    ]);
    expect(result[1]?.room).toEqual({
      id: 'room-mars',
      name: 'Марс',
      floor: 2,
      capacity: 6,
    });
    expect(JSON.stringify(result)).not.toMatch(/authorUserId|cancelledAtUtc/);
  });

  it('reads past pages newest-first with a tie-safe cursor and no duplicates', () => {
    const reader = new DrizzleMyBookingsReader({ connection });
    const now = startsAtUtc + 10 * slotMilliseconds;
    [
      bookingRecord('past-c', {
        startsAtUtc: now - 4 * slotMilliseconds,
        endsAtUtc: now - 3 * slotMilliseconds,
      }),
      bookingRecord('past-b', {
        startsAtUtc: now - 4 * slotMilliseconds,
        endsAtUtc: now - 3 * slotMilliseconds,
      }),
      bookingRecord('past-a', {
        startsAtUtc: now - 5 * slotMilliseconds,
        endsAtUtc: now - 4 * slotMilliseconds,
      }),
      bookingRecord('cancelled-past', {
        startsAtUtc: now - 6 * slotMilliseconds,
        endsAtUtc: now - 5 * slotMilliseconds,
        cancelledAtUtc: now - slotMilliseconds,
      }),
      bookingRecord('foreign-past', {
        authorUserId: 'user-bob',
        startsAtUtc: now - 7 * slotMilliseconds,
        endsAtUtc: now - 6 * slotMilliseconds,
      }),
    ].forEach((record) => insertBookingRecord(connection, record));

    const first = reader.findPast('user-alice', now, null, 2);
    const second = reader.findPast(
      'user-alice',
      now,
      {
        startsAtUtc: first[1]?.startsAtUtc ?? 0,
        bookingId: first[1]?.id ?? '',
      },
      2,
    );

    expect(first.map(({ id }) => id)).toEqual(['past-c', 'past-b']);
    expect(second.map(({ id }) => id)).toEqual(['past-a']);
  });

  it('allows exactly one winner across concurrent independent connections', async () => {
    const first = createConcurrentBookingInsert(databasePath, 'race-a');
    const second = createConcurrentBookingInsert(databasePath, 'race-b');
    await Promise.all([first.ready, second.ready]);

    first.start();
    second.start();

    const results = await Promise.all([first.result, second.result]);
    const statuses = results.map((result) => result.status).sort();
    const winner = results.find((result) => result.status === 'created');
    const loser = results.find(
      (result) => result.status === 'BOOKING_CONFLICT',
    );

    expect(statuses).toEqual(['BOOKING_CONFLICT', 'created']);
    expect(winner).toBeDefined();
    expect(loser).toBeDefined();
    expect(countRows(connection, bookings)).toBe(1);
    expect(countRows(connection, bookingSlots)).toBe(2);
    expect(
      connection.drizzle.select({ id: bookings.id }).from(bookings).get()?.id,
    ).toBe(winner?.bookingId);
    expect(
      connection.drizzle
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.id, loser?.bookingId ?? 'missing'))
        .get(),
    ).toBeUndefined();
  });
});

function seedRequiredRecords(connection: DatabaseConnection): void {
  connection.drizzle
    .insert(rooms)
    .values([
      {
        id: 'room-aquarium',
        name: 'Акваріум',
        floor: 1,
        capacity: 4,
        createdAtUtc: Date.UTC(2026, 0, 1),
      },
      {
        id: 'room-mars',
        name: 'Марс',
        floor: 2,
        capacity: 6,
        createdAtUtc: Date.UTC(2026, 0, 1),
      },
    ])
    .run();
  connection.drizzle
    .insert(users)
    .values([
      {
        id: 'user-alice',
        name: 'Alice',
        email: 'alice@example.com',
        normalizedEmail: 'alice@example.com',
        passwordHash: '$argon2id$test-only',
        createdAtUtc: Date.UTC(2026, 0, 1),
      },
      {
        id: 'user-bob',
        name: 'Bob',
        email: 'bob@example.com',
        normalizedEmail: 'bob@example.com',
        passwordHash: '$argon2id$test-only',
        createdAtUtc: Date.UTC(2026, 0, 1),
      },
    ])
    .run();
}

function bookingRecord(id: string, overrides: Partial<Booking> = {}): Booking {
  return {
    id,
    roomId: 'room-aquarium',
    authorUserId: 'user-alice',
    title: 'Planning',
    startsAtUtc,
    endsAtUtc: startsAtUtc + 2 * slotMilliseconds,
    createdAtUtc: Date.UTC(2026, 0, 1),
    cancelledAtUtc: null,
    ...overrides,
  };
}

function insertBookingRecord(
  connection: DatabaseConnection,
  booking: Booking,
): void {
  connection.drizzle.insert(bookings).values(booking).run();
}

function createBooking(
  repository: DrizzleBookingRepository,
  booking: Booking,
): void {
  repository.withImmediateTransaction((transaction) => {
    transaction.createBookingWithSlots(booking, [
      booking.startsAtUtc,
      booking.startsAtUtc + slotMilliseconds,
    ]);
  });
}

function countRows(
  connection: DatabaseConnection,
  table: typeof bookings | typeof bookingSlots,
): number {
  return (
    connection.drizzle
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .get()?.count ?? 0
  );
}

function createConcurrentBookingInsert(
  databasePath: string,
  bookingId: string,
) {
  const worker = new Worker(
    `
      const { parentPort, workerData } = require('node:worker_threads');
      const Database = require('better-sqlite3');
      const database = new Database(workerData.databasePath);
      database.pragma('journal_mode = WAL');
      database.pragma('foreign_keys = ON');
      database.pragma('busy_timeout = 5000');
      parentPort.postMessage({ status: 'ready' });
      parentPort.once('message', () => {
        try {
          database.exec('BEGIN IMMEDIATE');
          database.prepare(
            'INSERT INTO bookings (id, room_id, author_user_id, title, starts_at_utc, ends_at_utc, created_at_utc, cancelled_at_utc) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)'
          ).run(
            workerData.bookingId,
            'room-aquarium',
            workerData.authorUserId,
            'Concurrent planning',
            workerData.startsAtUtc,
            workerData.startsAtUtc + 2 * workerData.slotMilliseconds,
            Date.UTC(2026, 0, 1)
          );
          const insertSlot = database.prepare(
            'INSERT INTO booking_slots (booking_id, room_id, slot_starts_at_utc) VALUES (?, ?, ?)'
          );
          insertSlot.run(
            workerData.bookingId,
            'room-aquarium',
            workerData.startsAtUtc
          );
          insertSlot.run(
            workerData.bookingId,
            'room-aquarium',
            workerData.startsAtUtc + workerData.slotMilliseconds
          );
          database.exec('COMMIT');
          parentPort.postMessage({
            status: 'created',
            bookingId: workerData.bookingId,
          });
        } catch (error) {
          if (database.inTransaction) {
            database.exec('ROLLBACK');
          }
          const isConflict =
            typeof error.code === 'string' &&
            error.code.startsWith('SQLITE_CONSTRAINT') &&
            typeof error.message === 'string' &&
            error.message.includes(
              'booking_slots.room_id, booking_slots.slot_starts_at_utc'
            );
          parentPort.postMessage({
            status: isConflict ? 'BOOKING_CONFLICT' : 'unexpected',
            bookingId: workerData.bookingId,
          });
        } finally {
          database.close();
          parentPort.close();
        }
      });
    `,
    {
      eval: true,
      workerData: {
        databasePath,
        bookingId,
        authorUserId: bookingId === 'race-a' ? 'user-alice' : 'user-bob',
        startsAtUtc,
        slotMilliseconds,
      },
    },
  );
  const ready = new Promise<void>((resolve, reject) => {
    worker.once('message', (message: unknown) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'status' in message &&
        message.status === 'ready'
      ) {
        resolve();
      } else {
        reject(new Error('Concurrent booking worker was not ready'));
      }
    });
    worker.once('error', reject);
  });
  const result = new Promise<ConcurrentBookingResult>((resolve, reject) => {
    worker.on('message', (message: unknown) => {
      if (
        typeof message === 'object' &&
        message !== null &&
        'status' in message &&
        message.status !== 'ready' &&
        'bookingId' in message &&
        typeof message.bookingId === 'string' &&
        (message.status === 'created' ||
          message.status === 'BOOKING_CONFLICT' ||
          message.status === 'unexpected')
      ) {
        resolve({
          status: message.status,
          bookingId: message.bookingId,
        });
      }
    });
    worker.once('error', reject);
  });

  return {
    ready,
    result,
    start: () => worker.postMessage('start'),
  };
}
