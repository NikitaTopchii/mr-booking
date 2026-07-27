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

## Limitations

Slot rows add storage and transaction work. SQLite contention still needs
busy-timeout/error handling. Product documents list race protection as a
bonus, while the frozen architecture adopts it early to avoid a later schema
rewrite; bonus evidence still requires a passing file-backed concurrency test.
