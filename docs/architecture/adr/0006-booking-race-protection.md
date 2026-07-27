# ADR 0006: Booking Race Protection

- **Status:** Accepted

## Context

Two requests can both pass an application-level overlap read before either
write commits. A find-then-insert flow cannot guarantee one winner.

## Decision

Represent every active 30-minute interval with `BookingSlot`. Enforce unique
`(roomId, slotStartsAtUtc)` ownership. Create booking and slots in one
immediate write transaction; map uniqueness failure to `BOOKING_CONFLICT`.
Cancellation releases slots in the booking transaction.

## Alternatives considered

- Client-side availability checks: rejected because clients are not
  authoritative.
- Non-transactional overlap query then insert: rejected as racy.
- Global application mutex: rejected because it is process-local and hard to
  prove.
- Database-specific range constraints: unavailable in SQLite.

## Consequences

Exactly one concurrent request can own a room slot. Adjacent half-open
intervals remain valid.

Phase 3A implements this decision in `0002_booking_foundation.sql` and
`DrizzleBookingRepository`. A file-backed integration test starts two worker
threads with independent SQLite connections against the same room and
interval. Exactly one transaction commits, the other maps the room-slot
constraint to `BOOKING_CONFLICT`, and no losing booking or orphan slot remains.
Cancellation sets `cancelled_at_utc` and deletes only that booking's slots in
one immediate transaction.

## Limitations

Slot rows add storage and transaction work. SQLite still has one writer; the
5000 ms busy timeout bounds contention and exhausted `SQLITE_BUSY` maps to
`DATABASE_BUSY`. This design supports one API writer process and does not
permit horizontal writers against the same file. Product documents list race
protection as a bonus, while the frozen architecture adopts it early to avoid
a later schema rewrite. The HTTP conflict mapping remains deferred with the
booking controllers.
