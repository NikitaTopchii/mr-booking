# ADR 0007: Custom Weekly Grid

- **Status:** Accepted

## Context

The official task requires a repository-owned weekly calendar and prohibits a
ready-made scheduling component.

## Decision

Build the core weekly layout and booking positioning with CSS Grid, a semantic
HTML table, and/or small generic positioning utilities. Keep calculations
independently testable and authoritative validation on the API.

## Alternatives considered

- FullCalendar: rejected by the specification.
- Another weekly/resource scheduler: rejected for the same reason.
- Canvas-only rendering: rejected because accessibility and semantic
  interaction would be harder.

## Consequences

The team controls mobile behavior, accessibility, current-time display, and
owned/foreign styling without library constraints.

## Limitations

Layout, overlap visualization, keyboard interaction, responsive behavior, and
tests require more implementation effort.
