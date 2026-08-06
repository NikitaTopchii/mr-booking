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

The compact schedule keeps the calendar adjacent to a collapsed bottom command
deck above the fixed app navigation. The deck contains a concise selected-room
and active-filter summary row, then previous, Today, next, and month-picker
controls. Its expanded panel opens upward with the existing room selector,
capacity filter, and timezone disclosure; it is not a second modal or a second
set of URL-state controls. The deck remains available during loading and
retains validation/error states until the resulting schedule is ready.

The sticky compact day strip belongs to the calendar frame, immediately above
the role grid. The strip
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
and the 19:00 `Europe/Kyiv` office close. It shows the selected interval in
the browser-local timezone only. These controls only assist input; the API
remains authoritative.

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

## Schedule Phase 2 visual hierarchy

The authenticated header content and schedule standard content use the same
centered max-width strategy. The schedule grid is wrapped in an explicit wide
breakout so the operational timeline can use the available viewport while the
heading and controls retain a readable measure. The breakout is clipped by the
schedule page and is verified at supported widths for no document overflow.

The toolbar uses a flat or single low-chrome surface rather than a large card.
Expanded layouts place the room group and the visually quieter capacity filter
on the left and keep previous/current/next week controls plus the visible date
range together on the right. Medium layouts use two intentional rows; compact
layouts keep the selected-room summary, change-room control, capacity filter,
navigation, and date strip discoverable without changing URL ownership or
filter behavior. Room options use the room name only; floor and capacity
remain visible in the selected-room metadata.

The grid exposes stable semantic markers for current-day treatment,
full-hour/half-hour boundaries, the current-time indicator, and own/foreign
booking ownership. These markers support focused visual and accessibility
tests without coupling tests to exact Tailwind color strings. The current-time
text equivalent is attached to the grid through `aria-describedby`; it is not a
live announcement. All existing loading, error, empty, no-match, keyboard,
capacity-filter, and mobile bottom-navigation-clearance behavior remains
feature-owned and unchanged.

## Schedule visual-direction reset

The approved reference direction is a confident operational calendar: concise
titles, minimal explanation, reduced borders/shadows, compact controls, and
the calendar as the dominant surface. The visual refresh uses the supplied
palette: ink `#000010`, white canvas and surfaces `#FFFFFF`, neutral gray
`#CACAC8`, warm brown `#B6846B`, and vivid red `#F73149`. Ink is used on the
red action surface to preserve readable contrast; white is reserved for the
dark secondary surface. Calendar grid tokens remain quieter than controls so
the schedule stays readable without becoming a dense spreadsheet.

When the browser timezone differs from `Europe/Kyiv`, the schedule shows one
small localized office-timezone indicator. When it matches Kyiv, the indicator
is omitted. Calendar, booking-dialog, and My Bookings times remain in the
browser timezone; the booking dialog does not show a duplicate Kyiv interval.
The permanent content rule is: explain exceptions and errors, not obvious
primary interactions.

## Operational calendar details

The schedule is a calendar-first workspace, not a stack of cards. On compact
screens below 768px, its visible page heading is screen-reader-only because
the active bottom-navigation destination already establishes the location. The
default order is the calendar and its adjacent day strip, followed by the
command deck above the fixed app navigation. The command deck is collapsed by
default and exposes the room name, floor, capacity, and any applied capacity
summary. It uses a real
button with `aria-expanded` and `aria-controls`; Escape returns focus to that
button.

The expanded deck contains the existing room selector and capacity form. Its
local presentation state is not part of the schedule URL. After a successful
room change, valid capacity application, or clear action, it collapses only
when the resulting schedule state is ready and error-free. Validation,
no-match, and query-error states leave the controls available. Expansion uses
only a grid-row, opacity, and chevron transition, and the global
reduced-motion policy makes it effectively immediate.

The compact main layout owns one `100dvh` contract through
`--app-header-height`, `--mobile-schedule-main-height`, and the safe-area-aware
mobile navigation tokens. The grid frame gets the remaining flex space; its
role grid is the vertical scroll container while the day strip stays adjacent
to it. The command deck grows upward without covering the calendar or the app
navigation. It keeps native scrolling, sticky time rail support, focus
scroll-into-view, and bottom scroll padding without a scattered fixed-height
calculation. Medium
layouts from 768px use an always-visible two-column toolbar; the expanded
desktop toolbar uses one aligned room/filter group and one week/range group.

The desktop title has a subtle structural rule rather than a heavy divider,
and active desktop navigation uses one steel-blue underline treatment. The
grid stays wide at desktop sizes, with day separators stronger than hourly
lines and hourly lines stronger than half-hour lines. Current-day treatment
and the thin current-time marker stay informative without producing a glow or
a second visual focal point.

Own bookings retain the steel-blue ownership treatment. Each foreign booking
uses a deterministic controlled color derived from the safe schedule DTO
`author.id`; the visible author name and ownership icon remain mandatory cues.
Foreign colors also select a controlled light/dark text treatment. Booking
blocks use only a compact three-pixel accent edge, small radius, and restrained
fill—never a card shadow or full dark outline. The assignment is
presentation-only and never participates in authorization, availability, or
booking rules. Hover, keyboard focus, and pressed slot/block states remain
visible, and directional week transitions are CSS-only and disabled for
reduced-motion users.
