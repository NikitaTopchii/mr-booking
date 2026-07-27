import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    normalizedEmail: text('normalized_email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAtUtc: integer('created_at_utc').notNull(),
  },
  (table) => [
    uniqueIndex('users_normalized_email_unique').on(table.normalizedEmail),
    check('users_name_non_empty', sql`length(trim(${table.name})) > 0`),
    check(
      'users_created_at_utc_integer',
      sql`typeof(${table.createdAtUtc}) = 'integer'`,
    ),
  ],
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    createdAtUtc: integer('created_at_utc').notNull(),
    expiresAtUtc: integer('expires_at_utc').notNull(),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_user_id_index').on(table.userId),
    index('sessions_expires_at_utc_index').on(table.expiresAtUtc),
    check(
      'sessions_timestamps_integer',
      sql`typeof(${table.createdAtUtc}) = 'integer' AND typeof(${table.expiresAtUtc}) = 'integer'`,
    ),
    check(
      'sessions_expiry_after_creation',
      sql`${table.expiresAtUtc} > ${table.createdAtUtc}`,
    ),
  ],
);

export type UserRecord = typeof users.$inferSelect;
export type SessionRecord = typeof sessions.$inferSelect;
