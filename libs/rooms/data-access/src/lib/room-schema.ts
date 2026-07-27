import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const rooms = sqliteTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    floor: integer('floor').notNull(),
    capacity: integer('capacity').notNull(),
    createdAtUtc: integer('created_at_utc').notNull(),
  },
  (table) => [
    uniqueIndex('rooms_name_unique').on(table.name),
    check('rooms_name_non_empty', sql`length(trim(${table.name})) > 0`),
    check('rooms_floor_integer', sql`typeof(${table.floor}) = 'integer'`),
    check(
      'rooms_capacity_positive',
      sql`typeof(${table.capacity}) = 'integer' AND ${table.capacity} > 0`,
    ),
    check(
      'rooms_created_at_utc_integer',
      sql`typeof(${table.createdAtUtc}) = 'integer'`,
    ),
  ],
);

export type RoomRecord = typeof rooms.$inferSelect;
