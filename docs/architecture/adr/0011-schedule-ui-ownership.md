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

`booking-ui` owns reusable booking date/time formatting plus
`useBrowserTimeZone`. My Bookings owns its booking-row composition because its
section hierarchy, cancellation affordance, and schedule deep-link are feature
behavior rather than reusable presentation. The hook remains in `booking-ui`
because it is a browser-only capability consumed by both booking web features,
while the platform-neutral `shared-date-time` library remains React-free and
owns calendar-date and named-timezone primitives.

My Bookings owns its outbound schedule deep-link adapter. This keeps the
features independent while preserving links from a personal booking to the
same browser-local schedule date and normalized week.

The schedule feature has one route-state owner: `useScheduleNavigation`. All
schedule URL writers use its canonical patch operation, which starts from the
latest observed or pending route query and preserves unrelated parameters.
Capacity application is one atomic history update containing the canonical
`minCapacity` and the selected fallback `roomId`; room normalization cannot
replace that update with an older query snapshot. Date/week and room changes
preserve an active capacity filter, while invalid query normalization uses
`router.replace` and Apply/Clear use history entries.

## Consequences

Schedule algorithms and models can evolve without expanding the reusable
booking presentation API. My Bookings and schedule share only lower-level
booking UI, data-access, shared date-time, and domain boundaries. The route
contract is `date`, normalized `week`, optional `roomId`, and optional positive
integer `minCapacity`; a filter uses inclusive `capacity >= minCapacity`
semantics and no-match state clears the room without requesting a schedule.
Recurring booking UI can add schedule-independent presentation without placing
recurrence policy in `booking-ui`.
