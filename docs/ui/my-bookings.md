# My Bookings UI

The localized `/uk/my-bookings` and `/en/my-bookings` routes remain Server
Components. They load the typed dictionary on the server and pass only the
`myBookings` slice into the interactive booking feature.

## Information and interaction model

- Upcoming and Past are independent sections with independent loading, error,
  retry, empty, and success states.
- Each booking card shows title, safe room metadata, server-derived status,
  and date/time formatted in the detected browser timezone.
- The card's main link opens the localized schedule with `roomId` and the
  browser-local Monday in `week`. The cancellation button is a sibling, never
  nested inside the link.
- Only API-provided `canCancel: true` rows show cancellation. Confirmation
  uses the shared Radix dialog, names the booking/room/local time, explains
  the consequence, disables repeated submission, restores focus on close,
  and maps stale, cutoff, authentication, and service failures.
- Cancellation is never optimistic. On success the Upcoming SWR resource and
  cached schedules for the affected room revalidate; loaded Past pages remain
  intact.
- Past uses `useSWRInfinite` with opaque HMAC-signed cursors, appends pages,
  deduplicates by booking ID, preserves loaded rows on incremental failure,
  and exposes a deliberate end-of-history state.

## Responsive and accessibility baseline

The page is a mobile-first single column at 375px and retains the same
information hierarchy at 768px, 1024px, and 1440px. Controls have practical
44px targets, semantic headings/lists/articles, visible token-based focus,
text status labels rather than color-only meaning, and no page-level
horizontal overflow.

The advisory UI/UX review recommended single-column hierarchy, visible loading
feedback, disabled pending actions, token colors, and clear focus/touch
states; those recommendations were accepted. Liquid Glass, a new palette,
new typography, and decorative motion were rejected to preserve the
repository's established design system, performance, and reduced-motion
baseline.
