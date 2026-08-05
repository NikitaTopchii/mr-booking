# ADR 0011: Schedule UI Ownership

- **Status:** Accepted

## Context

`booking-ui` had become a mixed boundary. It exposed schedule range
calculation, URL normalization, slot and current-time models, timezone
conversion helpers, and schedule presentation types alongside booking cards
and booking date formatting.

The schedule and My Bookings features are independent browser composition
boundaries and must not depend on one another.

## Decision

`booking-feature-schedule` owns schedule-specific range calculation,
navigation contracts and normalization, slot and indicator models, schedule
presentation types, and schedule-only date helpers and formatting.

`booking-ui` owns reusable booking presentation (`MyBookingCard` and booking
date/time formatting) plus `useBrowserTimeZone`. The hook remains there because
it is a browser-only capability consumed by both booking web features, while
the platform-neutral `shared-date-time` library remains React-free and owns
calendar-date and named-timezone primitives.

My Bookings owns its outbound schedule deep-link adapter. This keeps the
features independent while preserving links from a personal booking to the
same browser-local schedule date and normalized week.

## Consequences

Schedule algorithms and models can evolve without expanding the reusable
booking presentation API. My Bookings and schedule share only lower-level
booking UI, data-access, shared date-time, and domain boundaries. Recurring
booking UI can add schedule-independent presentation without placing
recurrence policy in `booking-ui`.
