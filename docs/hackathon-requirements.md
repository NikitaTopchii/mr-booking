# UA-SKILLS Meeting-Room Booking Requirements

This document owns product-specific scope and acceptance criteria. The
engineering rules that govern implementation live in the root `AGENTS.md`.

## Mandatory acceptance scope

### Authentication

- A user can register with name, email, and password, then log in and log out.
- The authenticated session survives a page reload.
- Name is non-empty. Password length is 8–72 characters.
- Email is trimmed, normalized case-insensitively, and unique after
  normalization.
- Server-side validation is authoritative and forms show clear field errors.

### Rooms

- Seed 5–6 rooms and expose each room's name, floor, and capacity.
- No room administration panel is required.
- Common office hours are 09:00–19:00 in `Europe/Kyiv`.

### Weekly schedule

- Show one selected room and one week at a time.
- Days run horizontally, time runs vertically, and slots are 30 minutes.
- Each booking shows title and author.
- Users can navigate to the previous and next week.
- The grid is implemented manually; a ready-made calendar/scheduler component
  cannot implement its core layout or positioning.

### Timezones

- Persist absolute timestamps in UTC.
- Display dates and times in the browser timezone.
- Validate office hours in `Europe/Kyiv`.
- Clearly show the office timezone when it differs from the browser timezone.

### Booking creation

- A booking captures room, date, start, end, and title.
- Title length is 1–100 characters.
- Start/end align to 30-minute boundaries.
- Duration is 30 minutes through 4 hours.
- Bookings are in the future, wholly inside office hours, and cannot overlap
  an active booking.
- Adjacent intervals are valid.

### Cancellation

- An owner can cancel their booking with confirmation or undo.
- Another user cannot cancel it through either the UI or a direct API request.

### Personal bookings

- Upcoming bookings sort nearest first; past bookings sort newest first.
- Past results use pagination or incremental loading.
- Each row shows date, time, room, and title in the browser timezone.
- Selecting a row opens the corresponding room and week.

### Interface quality

- Use a consistent design and a responsive layout.
- Provide loading, empty, and error states; field-level errors; and disabled
  request buttons.
- Mark the current day/time and distinguish the user's bookings.

### Technical and delivery acceptance

- Use TypeScript, Next.js, NestJS, SQLite, and UTC persistence.
- Hash passwords with Argon2 or bcrypt.
- Seed rooms, test users, and demo bookings.
- Provide a useful `.env.example`.
- `npm test` runs the real mandatory test suite.
- README and Git history are meaningful.

## Bonuses

The following remain bonuses and do not replace mandatory acceptance scope:

- Docker Compose one-command startup;
- transaction-safe booking race protection;
- API integration tests;
- room-capacity filtering;
- complete mobile experience;
- development email verification;
- in-app end-of-booking notifications;
- recurring weekly bookings;
- installable PWA;
- Web Push and released-slot watching.

Bonus work begins only after mandatory behavior passes. See `AGENTS.md` for
the preferred order and technical constraints.

For development email verification, log the verification link on the server
and prevent unverified users from creating bookings. End-of-booking
notifications, when implemented, notify the current owner exactly once N
minutes before the end only when the following room slot is occupied; suppress
them if either booking is cancelled. Read N from `NOTIFY_BEFORE_MINUTES` with
a default of 10.

Offline PWA behavior is read-only and never confirms booking creation or
cancellation. PWA and Web Push work MUST NOT displace mandatory or
higher-priority bonus work.
