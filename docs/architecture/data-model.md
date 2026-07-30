# Preliminary Mandatory Data Model

This is an implementation-independent schema outline. Exact SQL names are
chosen with the first migration, while these invariants remain fixed.

All absolute timestamps use integer UTC epoch milliseconds in SQLite and ISO
8601 absolute datetime strings at the booking HTTP boundary.

## User

**Responsibility:** registered identity and password authentication.

Required fields:

- `id`;
- `name`;
- `email`;
- `normalizedEmail`;
- `passwordHash`;
- `createdAtUtc`;

Constraints and indexes:

- primary key on `id`;
- unique constraint/index on `normalizedEmail`;
- database check for a name that remains non-empty after trimming.

Lifecycle: created at registration; name/email changes are outside mandatory
scope; deleting users is outside mandatory scope.

## Session

**Responsibility:** persistent authenticated browser session.

Required fields:

- `id`;
- `userId`;
- `tokenHash`;
- `expiresAtUtc`;
- `createdAtUtc`.

Constraints and indexes:

- primary key on `id`;
- unique constraint on `tokenHash`;
- foreign key `userId -> User.id`;
- indexes on `userId` and `expiresAtUtc`.
- check that both timestamps are integers and expiry follows creation.

`tokenHash` is the 64-character lowercase hexadecimal SHA-256 digest of the
32-byte base64url browser token. The raw token is never a database field.

Lifecycle: created on login/registration, resolved on protected requests,
deleted or invalidated on logout, and rejected after expiry. Cookie material
is not stored or logged in plaintext. Multiple active sessions per user are
allowed; only the current token hash is deleted on logout.

## Room

**Responsibility:** deterministic meeting-room catalogue.

Required fields:

- `id`;
- `name`;
- `floor`;
- `capacity`;
- `createdAtUtc`.

Constraints and indexes:

- primary key on `id`;
- unique room name for deterministic seed identity;
- checks for non-empty name and positive capacity;
- index on `(floor, name)`.

Lifecycle: inserted by committed seeds. Room administration is outside
mandatory scope.

## Booking

**Responsibility:** user-owned meeting interval for one room.

Required fields:

- `id`;
- `roomId`;
- `authorUserId`;
- `title`;
- `startsAtUtc`;
- `endsAtUtc`;
- `createdAtUtc`;
- `cancelledAtUtc` nullable.

Constraints and indexes:

- primary key on `id`;
- foreign keys `roomId -> Room.id` and `authorUserId -> User.id`;
- checks for a non-empty trimmed title, title length at most 100, integer UTC
  timestamps, `startsAtUtc < endsAtUtc`, duration from 30 minutes through four
  hours, and duration divisible by 30 minutes;
- partial active index on `(roomId, startsAtUtc)`;
- partial active index on `(authorUserId, startsAtUtc)`.

Lifecycle: created with all slots in one transaction. Cancellation sets
`cancelledAtUtc` and releases slots in one transaction. A cancelled booking
is retained for integrity but excluded from active schedule and mandatory
personal-list results. A repeated owner cancellation preserves the first
`cancelledAtUtc`; a booking that has already started cannot be newly
cancelled.

## BookingSlot

**Responsibility:** database-enforced ownership of each active 30-minute room
slot.

Required fields:

- `bookingId`;
- `roomId`;
- `slotStartsAtUtc`.

Constraints and indexes:

- composite primary key on `(bookingId, slotStartsAtUtc)`;
- foreign key `bookingId -> Booking.id` with appropriate cascading cleanup;
- foreign key `roomId -> Room.id`;
- unique constraint on `(roomId, slotStartsAtUtc)`;
- the composite primary-key prefix supports lookup and deletion by
  `bookingId`;
- slot timestamps align to office 30-minute boundaries.

Lifecycle: every interval owns one row per start slot. For 10:00–11:00, rows
start at 10:00 and 10:30, not 11:00. All rows are inserted atomically with the
booking and removed atomically on cancellation.

Migration `0002_booking_foundation.sql` implements these tables and constraints.
Absolute timestamps are integer UTC epoch milliseconds. Europe/Kyiv
interpretation, strict-future validation, local office-day boundaries, and
ownership remain authoritative application policies because SQLite cannot
safely infer them from an absolute instant.

The Phase 3B room-schedule read model queries `bookings` directly, joins only
`users.id` and `users.name`, excludes cancelled rows, and applies half-open
overlap semantics. `booking_slots` remains an internal write-concurrency
mechanism and is never an API response model.

The Phase 3D personal-booking read model also queries `bookings` directly and
joins only safe room metadata. It scopes by `author_user_id`, excludes
cancelled rows, partitions on `ends_at_utc` using the authoritative server
clock, and uses `(starts_at_utc, id)` stable cursor ordering. The existing
partial active `(author_user_id, starts_at_utc)` index covers the ownership
filter and primary ordering, so Phase 3D does not change the schema or UTC
epoch-millisecond representation.

## Deferred bonus extensions

Recurring series, notifications, outbox records, push subscriptions, and
released-slot watchers are not part of the mandatory model. Add them only
through later ADRs and migrations when the corresponding bonus is selected.
