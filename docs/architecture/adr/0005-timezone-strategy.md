# ADR 0005: Timezone Strategy

- **Status:** Accepted

## Context

Users may view the application outside Kyiv while office-hour policy remains
fixed to the office location.

## Decision

Persist absolute instants in UTC. Apply booking boundaries and office hours in
`Europe/Kyiv` using the server clock. Display instants in the detected browser
timezone and show the office timezone when it differs.

## Alternatives considered

- Persist local strings: rejected as ambiguous and DST-unsafe.
- Validate in browser timezone: rejected because office policy would vary by
  user.
- Trust browser clock: rejected for correctness and security.

## Consequences

One centralized conversion policy supports consistent API, persistence, and
tests. DST cases are explicit test inputs.

Phase 3A implements the server policy with one `Intl.DateTimeFormat` fixed to
`Europe/Kyiv`. It extracts numeric office-local calendar fields from absolute
instants; it never compares locale-formatted strings or hardcodes UTC offsets.
Tests cover the 2026 spring and autumn offset transitions plus opening and
closing boundaries.

## Limitations

Conversion requires a timezone-aware library/platform API and careful handling
of local dates. The official specification does not define closed weekdays;
the current documented assumption applies office hours to every bookable day.
