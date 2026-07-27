# SQLite and Persistence Rules

Use SQLite, Drizzle ORM, `better-sqlite3`, and Drizzle Kit migrations. Do not
add Prisma, TypeORM, or another ORM.

The API MUST enable and verify:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

Only one NestJS API instance may own and write the SQLite file in the
hackathon deployment. The frontend MUST NOT mount the database volume.

Use committed migrations only; production auto-sync is prohibited. Apply
primary keys, foreign keys, unique, not-null, and check constraints plus
indexes wherever SQLite supports them. Write transactions MUST be short,
indexed, and free of network calls, push delivery, and slow computation.

Handle `SQLITE_BUSY` deliberately. Keep the configured busy timeout, avoid
unbounded retries, and map exhausted contention to a stable application error
instead of leaking a driver message.

## Booking-slot ownership

Concurrency-safe creation uses one `booking_slots` row for every active
30-minute slot, protected by:

```text
UNIQUE(room_id, slot_starts_at_utc)
```

Creation MUST atomically:

1. begin an immediate write transaction;
2. validate the room and interval;
3. insert the booking;
4. insert every slot row;
5. insert required outbox records;
6. commit.

Map a unique-slot violation to `BookingConflictError`. Cancellation MUST
atomically remove or release active slot rows. Adjacent intervals remain
valid. A client check or non-transactional find-then-insert is insufficient.

Integration tests involving WAL, locks, multiple connections, transaction
contention, or race protection MUST use temporary file-backed databases, not
only `:memory:`.
