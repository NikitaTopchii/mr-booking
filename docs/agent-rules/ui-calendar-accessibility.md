# UI, Calendar, and Accessibility Rules

Use one UI system: shadcn/ui, Radix primitives, Tailwind CSS, Lucide icons,
and Sonner. Reuse a compatible existing preset; otherwise select and freeze
one shadcn preset, preferably the chosen Luma-style foundation, before feature
development. Do not install MUI, Chakra, Mantine, Ant Design, or another
complete UI system.

Generic primitives belong in `libs/shared/web/ui`; domain components stay in
their owning domain. `Button` and `Dialog` are generic; `BookingCard`,
`WeeklyScheduleGrid`, and `RoomCapacityFilter` are domain UI.

Colors, spacing, typography, radii, shadows, and motion MUST use design
tokens. Do not scatter arbitrary colors or duplicate component variants.

## Responsive and accessible behavior

Implement phone layout first, adapt tablet, then enhance desktop. Essential
behavior MUST work without hover. Provide comfortable touch targets, keyboard
navigation, visible focus, semantic elements, accessible labels and field
errors, sufficient contrast, reduced-motion support, and safe-area handling
for installed PWA layouts.

Every data-driven screen MUST represent loading, empty, error, success,
disabled, permission-denied, and—where applicable—offline states.

## Weekly calendar

Implement the weekly grid manually in repository code using CSS Grid, a
semantic HTML table, and/or small generic positioning utilities. FullCalendar,
ready-made weekly/resource schedulers, and libraries implementing core layout
or overlap positioning are prohibited.

The independently testable grid MUST show:

- one selected room and one week;
- days horizontally and time vertically;
- 30-minute slots and office working hours;
- booking title and author;
- current day and current-time indicator;
- visually distinct owned and foreign bookings;
- previous and next week navigation.

Do not merely shrink a desktop calendar on mobile; provide a usable mobile
interaction. The grid MUST NOT perform authoritative server validation.
