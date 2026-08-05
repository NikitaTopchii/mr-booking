# Adaptive Schedule UX

Phase 3C.1 keeps one authoritative schedule state and adapts only its
presentation:

- compact widths below 640 CSS pixels show the selected browser-local day;
- medium widths from 640 through 1023 pixels show the selected date and the
  following two calendar days;
- expanded widths from 1024 pixels show the Monday-based seven-day week.

The focused medium range intentionally crosses a week boundary when the
selected date is Friday, Saturday, or Sunday. This keeps the selected date as
the predictable anchor.

## URL and data model

`date=YYYY-MM-DD` is the authoritative browser-local selected date. `week`
remains a normalized Monday for backward compatibility and shareable desktop
context. A valid legacy `week` without `date` selects today when today is
inside that week, otherwise its Monday. Missing or invalid values fall back to
today. Schedule-owned navigation normalizes room and date updates, while the
My Bookings feature owns its outbound schedule deep-link adapter. Reload, Back,
Forward, locale changes, and My Bookings deep links preserve context.

The complete schedule route contract is `date`, normalized `week`, optional
`roomId`, and optional positive-integer `minCapacity`. `useScheduleNavigation`
is the only schedule route-state owner. Every writer applies a patch to the
latest observed or pending query, preserving unrelated parameters. Applying a
capacity filter computes the inclusive `capacity >= minCapacity` room result
and its fallback room before issuing one `router.push`; date, week, and room
navigation preserve the active filter. Invalid or duplicate query values use
one canonical `router.replace`, while Apply and Clear remain history entries.

One hydration-safe media-query subscription selects the presentation. One SWR
resource then requests only its active half-open absolute ISO range:

- compact: the selected browser-local day;
- medium: the selected day plus two days;
- expanded: the Monday-based seven-day week.

SWR keys contain room ID, absolute start, and absolute end. Timeline
components do not fetch data and prior-room data is not presented under a new
room label.

## Compact interaction

The sticky compact context contains the room selector, week navigation,
Today, month-picker access, room metadata, and a seven-day strip. The strip
uses seven touch-sized buttons, complete localized labels, `aria-pressed` for
selection, and `aria-current="date"` for today. The month dialog is secondary
date navigation only and does not request monthly availability.

The timeline has one stable time gutter and one full-width day column. Only
future available slot starts and booking blocks are interactive. Booking
labels include title, date, exact local interval, and ownership; visible
blocks show the exact interval and a text/icon ownership cue. The current-time
line renders only inside the visible day and office interval.

Creation and details dialogs become bottom sheets below 640 pixels, preserve
Radix focus trapping/restoration, and respect the bottom safe area. Creation
offers valid 30-, 60-, 90-, 120-, 150-, 210-, and 240-minute shortcuts plus
all valid end times. End choices are bounded by the four-hour domain maximum
and the 19:00 `Europe/Kyiv` office close. It shows the browser-local interval
and, when different, the corresponding `Europe/Kyiv` interval. These controls
only assist input; the API remains authoritative.

## Scrolling and safe areas

Compact mode has one page-level vertical flow and no calendar horizontal
scroll. The application shell owns `--mobile-navigation-occupied-space`,
composed from the navigation height, its safe-area-aware bottom offset, and a
small content clearance. The fixed navigation, page bottom inset, viewport
`scroll-padding-bottom`, and focusable-content `scroll-margin-bottom` all
consume that contract. This lets the final timeline slot, booking controls,
and My Bookings actions scroll fully above the fixed navigation without
duplicating feature-specific offsets.

Creation field errors remain feature-owned. A title validation error is placed
directly after the title input, referenced by `aria-describedby`, announced as
a visible polite error, and focuses the first invalid field after submission.
Domain conflicts and general service failures remain form-level contextual
alerts rather than being incorrectly attached to the title field. Dialogs use
the existing Radix layer above the navigation and retain bottom safe-area
padding.

The implementation preserves the repository-owned manual grid, semantic
tokens, Lucide icon set, reduced-motion handling, keyboard focus, localized
loading/error/empty states, and browser-timezone display. It does not add a
calendar framework, fake availability, device detection, or client-side
authoritative validation.
