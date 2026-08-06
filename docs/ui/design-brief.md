# UI Design Brief

This brief is input for `.agents/skills/ui-ux-pro-max/SKILL.md`. Skill output
is advisory and remains subordinate to repository requirements and ADRs.

## Product

MR Booking is an office meeting-room booking application for a junior
UA-SKILLS hackathon. Users register or log in, choose a room, understand its
weekly availability, create valid bookings, cancel their own bookings, and
review upcoming and past bookings.

## Design direction

- Calm, professional SaaS rather than playful or decorative.
- Fast visual comprehension under demo pressure.
- Clear hierarchy and restrained motion.
- Clarity, accessibility, and reliable state feedback over visual novelty.
- Do not select final colors or typography in this phase.

## Primary schedule experience

- Mobile-first interaction with a strong desktop weekly grid.
- One selected room and week.
- Days horizontal, time vertical, 30-minute slots.
- Current day and current-time indicator visible without dominating.
- Owned and foreign bookings are distinguishable by more than color alone.
- Booking title and author remain readable.
- Previous/next week and room selection are immediately discoverable.
- Browser timezone display and `Europe/Kyiv` office policy are unambiguous.
- A conflict clearly explains that the API rejected the interval and keeps a
  recovery path.

The grid is repository-owned. Do not recommend FullCalendar or another
ready-made weekly/resource scheduler.

## Required states

Design coherent:

- loading and background revalidation;
- empty room/week/personal list;
- recoverable query error;
- field and domain validation error;
- booking conflict;
- permission-denied/foreign booking;
- disabled mutation;
- confirmed creation/cancellation;
- read-only offline state when PWA work exists.

## Responsive targets

- Small phone baseline around 360–390 CSS px.
- Larger phone around 430 CSS px.
- Tablet around 768 CSS px.
- Desktop from 1024 CSS px, with a strong weekly overview.
- Wide desktop MAY add breathing room but MUST NOT reduce scanability.

Mobile must not be a scaled-down desktop calendar. It may use focused-day
navigation, controlled horizontal movement, or progressive detail while
preserving room/week context and all mandatory actions.

## Accessibility

- Keyboard operation and logical focus order.
- Visible focus and meaningful labels.
- At least 44×44 CSS px practical touch targets.
- Sufficient text/control contrast.
- Color is not the only ownership or status signal.
- Reduced-motion handling.
- Semantic schedule structure where practical.
- Field errors announced and associated with inputs.
- No hover-only behavior.

## Frozen implementation constraints

- Next.js App Router and smallest practical Client Components.
- shadcn/ui, Radix, Tailwind CSS, Lucide, and Sonner only.
- Design tokens for color, typography, spacing, radii, shadows, and motion.
- SWR for interactive server state.
- No Redux or second UI framework.
- No authoritative business validation in UI.

## Requested skill output for the next design phase

When the UI skill is intentionally invoked, ask for:

1. recommended visual direction;
2. candidate color and typography token systems;
3. phone/tablet/desktop schedule layout;
4. accessible interaction and focus model;
5. calendar, form, loading, empty, conflict, and permission states;
6. anti-patterns specific to this product.

Review and freeze accepted recommendations before implementation.

## Authentication UI decisions

The auth audit accepted a calm hierarchy, 4/8-point spacing rhythm, visible
inline errors, 44px minimum controls, stable submit width, clear keyboard
focus, restrained motion, and responsive checks at 375, 768, 1024, and 1440
CSS pixels. Authentication now composes the shared shadcn New York primitives
with semantic Tailwind tokens.

On mobile, the primary auth content uses a persistent bottom-sheet surface
anchored to the viewport edge with safe-area padding. It is page content, not
a dismissible modal: it has no backdrop, close action, or drag affordance. From
the tablet breakpoint upward, the same content becomes a borderless inline
form without card elevation or rounded container styling.

The form heading is the first visual element; redundant logo and product
eyebrow treatments are omitted. A compact `uk / en` language switch follows
the form, while preserving full accessible names and 44px touch targets.

The generated hero/social-proof layout, liquid-glass treatment, amber palette,
external font pairing, blur, and morphing animation recommendations were
rejected. They conflict with the focused product task, accessibility,
performance, existing visual direction, and the requirement not to redesign
the application. Dark mode remains intentionally deferred until its complete
token and contrast pairs can be designed and verified.

Phase 2C retained these decisions and hardened behavior instead of redesigning
the surface. Presentational auth UI no longer depends on Next.js routing;
feature orchestration owns navigation. Field errors are associated with their
inputs, announced politely, and focus moves to the first invalid field only
after a server submission has re-enabled the controls. Real-browser checks
covered 375, 768, 1024, and 1440 CSS-pixel widths with no horizontal overflow.

## Authenticated shell and My bookings foundation

Phase 2D keeps the existing calm token system and introduces one protected
application shell. Desktop uses a compact horizontal header; phones use the
same header plus a floating, rounded two-destination navigation capsule above
a token-based bottom surface. The capsule respects the device safe area and
the shell reserves enough content space beneath it. Active destinations
combine visible surface and font-weight changes with `aria-current="page"`.

The current user is shown through generated presentational initials and a
keyboard-operable Radix menu. Name and email are read-only safe-session
identity. The menu also owns locale-preserving language links and presents the
existing logout orchestration with pending and error states.

My bookings uses two visible sections rather than interactive tabs because
there is no data or selection state yet. Upcoming and Past each have a clear
heading, Lucide icon, and honest localized foundation copy; one primary action
returns to the localized Schedule.

Accepted UI-skill recommendations were persistent top-level navigation,
icon-and-label mobile destinations, 44px minimum controls, active state beyond
color, visible focus, one primary empty-state action, semantic tokens, safe
area spacing, constrained text measure, and checks at 375, 768, 1024, and 1440
CSS pixels. The follow-up mobile reference was adopted as a floating capsule
with 56px destinations, geometrically related outer and inner radii, a
transform-only sliding active indicator with reduced-motion fallback, and an
opaque token-based scrim. Manual browser review found and corrected a
mobile z-index overlap between the bottom navigation and user-menu trigger.

The generated horizontal-scroll journey, Liquid Glass treatment, amber/blue
palette replacement, Roboto import, morphing/blur effects, long animations,
adaptive desktop sidebar, and speculative loading skeletons were rejected.
They conflict with the frozen design direction, current tokens, performance,
the two-item information architecture, or the absence of a booking request.

## Phase 4A submission review

The UI/UX skill was run against an accessible, mobile-first meeting-room
product and followed with a focused accessibility/touch/loading search.
Accepted recommendations were the 375/768/1024/1440 responsive audit,
44×44px touch targets, visible focus, loading feedback, duplicate-submit
prevention, no body horizontal scrolling, safe-area clearance, restrained
motion, and high-contrast token usage. These align with the implemented
adaptive schedule and were retained rather than triggering a redesign.

The generated external Atkinson font, new sky/green palette, single-column
marketing-page structure, and dark-mode suggestion were rejected. They would
replace the established token system or describe a landing page rather than
the authenticated scheduling workspace. Decorative animation, a second icon
system, and a ready-made calendar were also rejected for accessibility,
performance, repository-stack, and specification reasons.

## Schedule Phase 2 visual hierarchy

The schedule refinement keeps the calm, dense operational-calendar direction
and applies it to the existing manual grid. The application header, schedule
heading, and standard schedule controls share one centered content grid. The
calendar itself uses an explicit wider breakout so seven-day scanning has room
without making the page horizontally scrollable.

The desktop toolbar is one primary surface with room selection first, capacity
filtering as a quieter secondary group, and week navigation as one labeled
control group. The room select carries the room name; floor and capacity remain
supporting metadata rather than being repeated in each option label. At medium
widths the controls use two deliberate rows, while compact widths retain the
selected-room context, compact navigation, and seven-day date strip.

The compact schedule follows the explicit rule: “On compact screens, the
calendar is the default working surface; configuration is disclosed on demand.”
Below 768px, the visible page title is removed while a screen-reader-only h1
remains. A collapsed room/filter dock precedes week navigation and the day
strip, then the calendar takes the remaining dynamic viewport height as the
primary scroll surface. Expanding the dock reveals room and capacity controls
with an accessible button/region relationship; successful explicit changes
return focus and attention to the calendar, while invalid input leaves the
dock open. The concise Kyiv-office indicator is conditional and belongs in the
dock, never as a permanent explanatory paragraph.

Timezone copy is deliberately minimal: visible times use the browser timezone,
and a compact localized office-timezone indicator appears only when the browser
timezone differs from Kyiv. Its accessible description retains the
09:00–19:00 Europe/Kyiv validation context without a permanent paragraph.
Current-day treatment continues through the grid, full-hour boundaries are
stronger than half-hour boundaries, and the current-time marker uses the
primary steel-blue semantic token.

Own and foreign bookings retain title, interval, and author/ownership text,
with an icon plus left-accent/fill treatment so color is not the only cue.
The visual skill recommendations for marketing typography, decorative
gradients, blur, and landing-page composition were rejected. The supplied
steel-blue palette was accepted as the schedule reference direction, with
contrast-safe derived surfaces and destructive red kept separate.

## Operational calendar composition

The authenticated product uses a mid-century industrial calendar direction:
modern, tactile, dense, and functional rather than a nostalgic recreation.
Its fixed ink/graphite/steel/mist/sage palette is `#020608`, `#1C252B`,
`#486B85`, `#93B4BC`, and `#CAD2CB`, with `#F4F3EE` canvas and `#FBFAF6`
meaningful working surfaces. Tokens, rather than component-local color
literals, assign semantic foreground, control, grid, ownership, focus, and
destructive roles. There is no dark mode, decorative gradient, blur, glass
surface, fake material, or ambient page shadow.

The shell is a thin control rail. Desktop destinations are adjacent controls
with a shared baseline and one clear active underline/surface; phone
navigation is the same two-destination rail at the viewport edge, not a
floating capsule. Small 4px and standard 6px radii, divider-led grouping, and
spacing provide hierarchy. Static page, grid, navigation, and list shadows are
not used; only a dropdown or dialog may use a restrained elevation shadow.

Schedule starts with a concise title and, only outside `Europe/Kyiv`, one
low-priority office-timezone indicator. Room selection and capacity filtering
lead the following control rail; week navigation remains a cohesive control
group. The grid is the wide dominant surface. Day, hour, and half-hour lines
form a deliberate hierarchy; the current day and thin current-time marker are
clear without glow. Directional week changes use a brief CSS-only transition
and honor reduced-motion preferences.

Booking blocks are integrated into the grid rather than elevated cards. Own
bookings use steel blue with a visible ownership icon and label. Foreign
bookings deterministically map the safe `author.id` to one controlled,
contrast-checked author color; title, author name, and an icon make ownership
understandable without relying on color. Slot hover, focus, and press states
are all visible. Dialogs use one structural surface and dividers; destructive
red is reserved for the final cancellation confirmation.

My Bookings owns its feature-specific row composition. Upcoming and past lists
use section headers, counts, dividers, direct local date/time, title, room,
and quiet actions rather than nested cards or repeated status badges. Counts
remain attached to their headings; rows use a repeatable date/time, detail,
and action grid. The full row opens the schedule while cancellation is quiet
until the final destructive confirmation dialog, and an empty past section
does not reserve a decorative block. The content rule remains: explain
exceptions and errors, not obvious actions.
Schedule, booking, and My Bookings times are browser-local; the compact office
timezone indicator is the only persistent policy cue when it is needed.
