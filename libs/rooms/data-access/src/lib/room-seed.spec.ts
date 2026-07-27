import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyMigrations,
  DatabaseConnection,
  openDatabase,
  resolveMigrationsFolder,
} from '@mr-booking/shared-database';
import { deterministicRooms, seedRooms } from './room-seed';

describe('room schema and deterministic seed', () => {
  let temporaryDirectory: string;
  let connection: DatabaseConnection;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'mr-booking-rooms-'));
    connection = openDatabase(join(temporaryDirectory, 'rooms.sqlite'));
    applyMigrations(connection, resolveMigrationsFolder());
  });

  afterEach(() => {
    connection.close();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('creates exactly the six required rooms', () => {
    seedRooms(connection);

    const records = connection.sqlite
      .prepare(
        'SELECT id, name, floor, capacity FROM rooms ORDER BY capacity ASC',
      )
      .all();

    expect(records).toEqual(
      deterministicRooms.map((room) => ({
        id: room.id,
        name: room.name,
        floor: room.floor,
        capacity: room.capacity,
      })),
    );
  });

  it('remains idempotent when applied repeatedly', () => {
    seedRooms(connection);
    seedRooms(connection);

    expect(
      connection.sqlite.prepare('SELECT COUNT(*) AS count FROM rooms').get(),
    ).toEqual({ count: 6 });
  });

  it('preserves room records outside the deterministic seed', () => {
    connection.sqlite
      .prepare(
        'INSERT INTO rooms (id, name, floor, capacity, created_at_utc) VALUES (?, ?, ?, ?, ?)',
      )
      .run('room-user-created', 'Тиха кімната', 5, 2, Date.UTC(2026, 1, 1));

    seedRooms(connection);

    expect(
      connection.sqlite.prepare('SELECT COUNT(*) AS count FROM rooms').get(),
    ).toEqual({ count: 7 });
  });

  it('enforces non-empty names and positive capacities', () => {
    const insert = connection.sqlite.prepare(
      'INSERT INTO rooms (id, name, floor, capacity, created_at_utc) VALUES (?, ?, ?, ?, ?)',
    );

    expect(() => insert.run('room-empty', '   ', 1, 4, Date.now())).toThrow();
    expect(() =>
      insert.run('room-capacity', 'Невалідна', 1, 0, Date.now()),
    ).toThrow();
  });
});
