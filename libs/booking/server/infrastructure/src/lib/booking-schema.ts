import { users } from '@mr-booking/auth-infrastructure/schema';
import { rooms } from '@mr-booking/rooms-infrastructure/schema';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const minimumDurationMilliseconds = 30 * 60 * 1000;
const maximumDurationMilliseconds = 4 * 60 * 60 * 1000;

export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id),
    authorUserId: text('author_user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    startsAtUtc: integer('starts_at_utc').notNull(),
    endsAtUtc: integer('ends_at_utc').notNull(),
    createdAtUtc: integer('created_at_utc').notNull(),
    cancelledAtUtc: integer('cancelled_at_utc'),
  },
  (table) => [
    index('bookings_active_room_start_index')
      .on(table.roomId, table.startsAtUtc)
      .where(sql`${table.cancelledAtUtc} IS NULL`),
    index('bookings_active_author_start_index')
      .on(table.authorUserId, table.startsAtUtc)
      .where(sql`${table.cancelledAtUtc} IS NULL`),
    check('bookings_title_non_empty', sql`length(trim(${table.title})) > 0`),
    check('bookings_title_max_length', sql`length(${table.title}) <= 100`),
    check(
      'bookings_timestamps_integer',
      sql`typeof(${table.startsAtUtc}) = 'integer' AND typeof(${table.endsAtUtc}) = 'integer' AND typeof(${table.createdAtUtc}) = 'integer' AND (${table.cancelledAtUtc} IS NULL OR typeof(${table.cancelledAtUtc}) = 'integer')`,
    ),
    check(
      'bookings_end_after_start',
      sql`${table.endsAtUtc} > ${table.startsAtUtc}`,
    ),
    check(
      'bookings_minimum_duration',
      sql`${table.endsAtUtc} - ${table.startsAtUtc} >= ${sql.raw(String(minimumDurationMilliseconds))}`,
    ),
    check(
      'bookings_maximum_duration',
      sql`${table.endsAtUtc} - ${table.startsAtUtc} <= ${sql.raw(String(maximumDurationMilliseconds))}`,
    ),
    check(
      'bookings_slot_duration',
      sql`(${table.endsAtUtc} - ${table.startsAtUtc}) % ${sql.raw(String(minimumDurationMilliseconds))} = 0`,
    ),
  ],
);

export const bookingSlots = sqliteTable(
  'booking_slots',
  {
    bookingId: text('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id),
    slotStartsAtUtc: integer('slot_starts_at_utc').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'booking_slots_booking_slot_primary',
      columns: [table.bookingId, table.slotStartsAtUtc],
    }),
    uniqueIndex('booking_slots_room_slot_unique').on(
      table.roomId,
      table.slotStartsAtUtc,
    ),
    check(
      'booking_slots_start_integer',
      sql`typeof(${table.slotStartsAtUtc}) = 'integer'`,
    ),
  ],
);

export type BookingRecord = typeof bookings.$inferSelect;
export type BookingSlotRecord = typeof bookingSlots.$inferSelect;
