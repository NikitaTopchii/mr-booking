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

## Limitations

CQRS introduces command/query/handler structure. It does not imply separate
databases or eventual consistency.
