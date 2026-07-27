# ADR 0004: CQRS Without Event Sourcing

- **Status:** Accepted

## Context

Authentication, booking mutation, and schedule/personal reads have distinct
use cases, but the project does not need event-stream reconstruction.

## Decision

Use explicit commands for state changes and queries for reads, with one
handler per meaningful use case. Persist current state normally. Domain events
may trigger secondary behavior, but there is no event sourcing or default
saga layer.

## Alternatives considered

- Service methods only: simple, but less explicit around independently tested
  use cases and transactions.
- Event sourcing: rejected as unnecessary complexity.
- Sagas for every workflow: rejected because mandatory operations are short,
  local transactions.

## Consequences

Controllers stay thin, handlers own use-case orchestration, and read/write
intent is explicit.

## Phase 3A pattern fit

The concrete problem is two security-sensitive booking mutations with
different validation, authorization, and transaction behavior. A direct
service method could perform each flow, but would not give NestJS one explicit
command boundary per use case or keep future controllers transport-only.
`CreateBookingCommand` and `CancelBookingCommand` therefore use the accepted
Command pattern with one handler each. Their inward `BookingRepository` port
uses a Repository/Adapter boundary because transaction ownership and
SQLite-specific constraint mapping must be independently testable.

The added complexity is three booking libraries, command/provider wiring, and
transaction callback contracts. No event bus, saga, generic CRUD repository,
or event sourcing is introduced.

## Limitations

CQRS introduces command/query/handler structure. It does not imply separate
databases or eventual consistency.
