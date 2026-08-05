# MR Booking

MR Booking is a submission-ready UA-SKILLS meeting-room booking application.
Employees can register or sign in, inspect a room schedule in their browser
timezone, create a valid booking, cancel their own future booking, and review
upcoming or paginated past bookings:

```text
Browser -> Caddy -> Next.js web -> NestJS API -> SQLite
```

The mandatory product is implemented in TypeScript with Next.js, NestJS,
SQLite, Drizzle, SWR, Tailwind, Radix/shadcn primitives, and a repository-owned
manual calendar. Implemented bonuses are one-command Docker Compose startup,
database-enforced race protection, booking API integration coverage, the
complete compact/mobile schedule, and the room-capacity filter.

## Prerequisites

- Node.js 24 LTS (the exact major is recorded in `.nvmrc`)
- Corepack with Yarn 4.17.1
- Docker with Docker Compose for the production-shaped local stack

Enable the pinned package manager once if needed:

```bash
corepack enable
```

## Install and configure

```bash
nvm use
yarn install --immutable
cp .env.example .env
```

The checked-in example contains safe local-development defaults. Production
configuration must provide every variable and an absolute `DATABASE_PATH`;
invalid configuration fails before either application starts.

Runtime variables:

| Variable                                     | Example/default           | Purpose                                                      |
| -------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`                                   | `development`             | Runtime mode                                                 |
| `APP_PORT`                                   | `3000`                    | Public Docker gateway port                                   |
| `WEB_INTERNAL_PORT`                          | `3001`                    | Next.js internal/local port                                  |
| `API_INTERNAL_PORT`                          | `3002`                    | NestJS internal/local port                                   |
| `DATABASE_PATH`                              | `.data/mr-booking.sqlite` | API-owned SQLite file; absolute in production                |
| `SEED_ON_START`                              | `true`                    | Run deterministic rooms/users/bookings at API start          |
| `DEMO_SEED_WEEK_START`                       | blank                     | Optional Kyiv Monday (`YYYY-MM-DD`) for demo records         |
| `OFFICE_TIME_ZONE`                           | `Europe/Kyiv`             | Fixed office policy zone                                     |
| `OFFICE_OPEN_TIME`                           | `09:00`                   | Fixed office opening boundary                                |
| `OFFICE_CLOSE_TIME`                          | `19:00`                   | Fixed office closing boundary                                |
| `WEB_ORIGIN`                                 | `http://localhost:3000`   | Public application origin                                    |
| `APP_PUBLIC_URL`                             | `http://localhost:3001`   | Trusted origin used to build verification links              |
| `API_INTERNAL_URL`                           | `http://localhost:3002`   | Server-side NestJS URL                                       |
| `SESSION_COOKIE_NAME`                        | `room_booking_session`    | HttpOnly opaque-session cookie name                          |
| `SESSION_TTL_DAYS`                           | `7`                       | Fixed session lifetime in days                               |
| `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`       | `1440`                    | Verification-token lifetime, bounded by validation           |
| `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` | `60`                      | Persisted resend cooldown                                    |
| `EMAIL_DELIVERY_MODE`                        | `development`             | Explicit development adapter or disabled production adapter  |
| `EXPOSE_DEVELOPMENT_VERIFICATION_LINK`       | `true` locally            | Gate for development-only links; must be false in production |
| `LOG_DEVELOPMENT_VERIFICATION_LINK`          | `true` in `.env.example`  | Explicit local server-log link; rejected in production       |

The production cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, scoped to `/`,
and has explicit max-age and expiry. The raw 256-bit token is never persisted:
only its SHA-256 hash is stored in SQLite.

## Local development

Start the web and API development servers:

```bash
yarn dev
```

This command validates the environment, applies migrations, optionally seeds
rooms and demo users when `SEED_ON_START=true`, and then starts both Nx
applications. The default local URLs are:

- Web: `http://localhost:3001`
- Ukrainian login: `http://localhost:3001/uk/login`
- Ukrainian registration: `http://localhost:3001/uk/register`
- English login: `http://localhost:3001/en/login`
- English registration: `http://localhost:3001/en/register`
- Web health: `http://localhost:3001/health`
- API liveness: `http://localhost:3002/api/health/live`
- API readiness: `http://localhost:3002/api/health/ready`

The local SQLite file is stored at the configured `DATABASE_PATH`.

## Docker stack

Start the complete stack:

```bash
yarn start
```

Only Caddy is published to the host. With the example configuration, use:

- Application: `http://localhost:3000`
- Web health: `http://localhost:3000/health`
- API liveness: `http://localhost:3000/api/health/live`
- API readiness: `http://localhost:3000/api/health/ready`

Inspect logs or stop the stack:

```bash
yarn logs
yarn stop
```

The API stores the SQLite database and its WAL/SHM files in a named Docker
volume. Normal stops and restarts preserve that volume.

To remove containers **and permanently delete the local Docker database
volume**, run:

```bash
yarn reset
```

This destructive command prints a warning before Compose removes the volume.
The next `yarn start` recreates the database, applies migrations, and seeds it
when enabled.

## Database workflow

Generate a SQL migration after an intentional schema change:

```bash
yarn db:generate
```

Apply committed migrations and run the complete idempotent demo seed:

```bash
yarn db:migrate
yarn db:seed
```

The seed owns six stable room records with deterministic floors and capacities:
Акваріум (1, 4), Марс (2, 6), Гагарін (2, 8), Орбіта (3, 10), Дніпро (3, 12),
and Київ (4, 16). Re-running it updates those stable records safely, creates
no duplicates, and does not delete user-created rooms.

The seed also creates missing demo users without changing an existing matching
account or resetting its password:

| Name  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Alice | `alice@example.com` | `password123` |
| Bob   | `bob@example.com`   | `password123` |

Passwords are seeded through the production Argon2id adapter. Six stable demo
bookings then exercise Alice and Bob, Акваріум and Марс, five weekdays,
owned/foreign styling, My Bookings, and adjacent 10:00–11:00 / 11:00–12:00
intervals. Each booking is accompanied by the same authoritative 30-minute
slot rows used by normal booking creation.

Set `DEMO_SEED_WEEK_START` to a valid Monday such as `2030-06-03` for a fixed
review week. When it is blank, the seed selects the next Monday in
`Europe/Kyiv`, keeping the schedule immediately usable. Re-running the seed
replaces only the six known demo booking IDs; it never deletes unrelated
users, rooms, bookings, or slots. Changing the reference week moves only those
known records.

## Authentication behavior

- `POST /api/auth/register` creates the user and first session atomically.
- `POST /api/auth/login` creates an independent session.
- `GET /api/auth/me` resolves the current unexpired session.
- `POST /api/auth/logout` idempotently deletes only the current session and
  clears its cookie.
- `/uk/schedule`, `/en/schedule`, `/uk/my-bookings`, and
  `/en/my-bookings` share one localized protected application shell.
  Unprefixed application routes redirect to the saved locale or Ukrainian by
  default. Auth pages and the protected layout redirect on the server based on
  the NestJS API result.

Authentication dictionaries live in `libs/shared/web/i18n`. They are typed,
dynamically imported by Server Components, and never loaded in Client
Components. API validation returns stable field codes; the active dictionary
provides user-facing text.

New registrations are authenticated immediately but start with
`emailVerified: false`. The localized `/uk/verify-email` and
`/en/verify-email` pages require an explicit confirmation before posting the
token. Authenticated users see a resend banner; a development link is shown
only when the explicit development configuration enables it. Production uses
the disabled delivery adapter until a real provider is approved and never
returns a raw token or verification URL.

When `EMAIL_DELIVERY_MODE=development` and
`LOG_DEVELOPMENT_VERIFICATION_LINK=true`, the development delivery adapter
also writes the authoritative link once to the local server log in the form
`[email-verification:development] Verification link for user <id>: <url>`.
This is the intentional development-only raw-token exception; production
validation rejects the flag, development delivery, and link exposure, and
`APP_PUBLIC_URL` must use HTTPS in production. The development log is not
persisted or sent through production telemetry.

Tokens expire after the configured TTL, resend is persisted and cooldown
protected, and every resend supersedes prior unused tokens. Invalid, expired,
superseded, and replayed tokens have one safe public result. Consumption is
serialized by SQLite immediate transactions, including concurrent requests.

Unverified users can read rooms, schedules, and My Bookings. Slot selection
routes them to verification guidance and `POST /api/bookings` enforces
`EMAIL_VERIFICATION_REQUIRED` server-side. Existing owners can still cancel
their own future bookings. Successful verification refreshes current-user
SWR state, so booking becomes available without relogin.

One user may remain logged in on multiple browsers. Session reads never extend
expiry. Missing, unknown, and expired sessions return `UNAUTHENTICATED`.
All authentication responses use `Cache-Control: private, no-store`.
Browser and server-side web clients runtime-validate safe-user and error
payloads before using them.

Supported application locales are Ukrainian (`uk`, default) and English
(`en`). Locale-prefixed links, redirects, logout, and the auth language
switcher preserve the corresponding route.

## Authenticated workspace

The protected Server Component layout resolves the current safe user once and
passes only name, email, and public user id into the application shell. The
shell provides product identity, active Schedule/My bookings navigation, a
read-only user menu, locale switching, and the existing logout flow.

Desktop uses horizontal primary navigation. Phone layouts use a floating
two-item navigation capsule over a token-based bottom gradient, with safe-area
spacing and reserved page padding; the user menu remains available in the
header. Both navigation forms use `aria-current="page"`, visible focus, and at
least 44px practical targets.

My bookings loads only the authenticated user's authoritative active records.
Upcoming includes future and in-progress meetings nearest first. Past is
newest first and incrementally loads opaque cursor pages. Cards show safe room
metadata and browser-local date/time, link to the matching room and
browser-local Monday, and expose server-authorized future cancellation through
an accessible confirmation dialog. Upcoming, Past, and incremental pages have
independent loading, empty, retry, error, and end states.

## Booking API and command foundation

The booking API exposes the authoritative write core and read models through
session-authenticated endpoints:

- `GET /api/rooms` returns safe room metadata in deterministic floor/name
  order;
- `GET /api/rooms/:roomId/bookings?fromUtc=2030-06-03T06%3A00%3A00.000Z&toUtc=2030-06-10T06%3A00%3A00.000Z`
  returns active bookings overlapping the requested half-open absolute range;
- `POST /api/bookings` creates a booking for the session user;
- `DELETE /api/bookings/:bookingId` cancels an owned future booking and
  returns `204`;
- `GET /api/bookings/mine/upcoming` returns owned active bookings whose end is
  after the authoritative server clock;
- `GET /api/bookings/mine/past?limit=20&cursor=...` returns owned completed
  active bookings through stable opaque cursor pagination.

Booking request timestamps are ISO 8601 absolute datetime strings with `Z` or
an explicit offset, for example `2030-06-03T09:00:00.000+03:00`. Responses
normalize every booking timestamp to canonical UTC such as
`2030-06-03T06:00:00.000Z`. Datetimes without timezone information are
rejected. Query-string datetime values must be URL-encoded when they contain
an explicit `+` offset.
The browser schedule uses `date=YYYY-MM-DD` as its authoritative browser-local
selected date and keeps a normalized Monday `week` for legacy compatibility.
It requests only the active compact one-day, medium three-day, or expanded
seven-day half-open range as canonical ISO 8601 parameters. Booking creation
validity is still evaluated authoritatively in `Europe/Kyiv`.
The optional `minCapacity` parameter is the authoritative persisted room
filter. It accepts only one canonical positive safe whole integer; invalid,
empty, zero, negative, decimal, text, unsafe, or repeated values are normalized
with a replace navigation while preserving `date`, `week`, `roomId`, and other
query parameters. The client filters the complete API room list inclusively
(`room.capacity >= minCapacity`) in API order. If the requested room no longer
matches, the first matching room is selected; when none match, the room ID is
cleared and no room schedule request is made. Applying and clearing the filter
use browser-history entries, so Back/Forward restores the filter and its room
selection.
Schedule reads exclude cancelled bookings and return only author ID/name.
`isMine` is server-derived, and booking-slot rows are never public.
Personal-booking reads join only safe room ID/name/floor/capacity metadata.
Their DTOs include server-derived `status`, `canCancel`, and `serverNowUtc`;
cancelled and foreign rows are excluded.

Example personal-booking requests after authentication:

```bash
curl --cookie cookie.txt http://localhost:3000/api/bookings/mine/upcoming
curl --cookie cookie.txt \
  'http://localhost:3000/api/bookings/mine/past?limit=20'
```

Use the returned opaque `nextCursor` without decoding or modifying it:

```bash
curl --cookie cookie.txt \
  'http://localhost:3000/api/bookings/mine/past?limit=20&cursor=RETURNED_CURSOR'
```

The authoritative booking rules are:

- titles are trimmed, Unicode-preserving, required, and limited to 100
  characters;
- public HTTP timestamps are absolute ISO 8601 strings and responses are
  canonical UTC with `Z`;
- absolute instants are stored internally as integer UTC epoch milliseconds;
- the server clock requires a strictly future start;
- office policy is evaluated in `Europe/Kyiv`, every day from 09:00 through
  19:00;
- boundaries use a 30-minute grid and duration is 30 minutes through four
  hours; the creation dialog offers quick choices through 4 hours, while the
  server and database remain authoritative;
- intervals are half-open, so 10:00–11:00 and 11:00–12:00 are adjacent and
  valid;
- each active interval owns deterministic 30-minute rows in `booking_slots`;
- unique `(room_id, slot_starts_at_utc)` ownership makes concurrent creation
  race-safe inside `BEGIN IMMEDIATE`;
- owner-only cancellation preserves the booking, records the server
  cancellation time, and releases its slots atomically;
- started bookings cannot be newly cancelled, while repeating an owner
  cancellation is idempotent.

SQLite is intentionally operated by one API process. WAL and a 5000 ms busy
timeout are enabled; exhausted write contention maps to `DATABASE_BUSY`.

## Quality checks

Run individual checks:

```bash
yarn test
npm test
yarn test:integration
yarn test:e2e
yarn audit:boundaries
yarn lint
yarn typecheck
yarn build
yarn format:check
```

Apply repository formatting with `yarn format:write`. Before committing, run
the sequential, fail-fast aggregate gate:

```bash
yarn verify:commit
```

The Nx workspace enforces tagged module boundaries. The web application
cannot import API-only database code, generic database infrastructure cannot
depend on feature libraries, and cross-library imports go through public
entry points.

The full gate executes unit/component suites, file-backed integration suites,
Playwright E2E, lint, typecheck, production builds, and Prettier sequentially.
`npm test` is not a placeholder: it invokes the Nx test target and includes
the mandatory adjacent, partial-overlap, exact-overlap, containment,
different-room, and neighbouring-day interval cases.

## Implemented and deferred bonuses

Implemented and verified in repository tests:

- complete development email verification: explicit-link logging, localized
  expiry/cooldown/supersession/replay handling, concurrent consumption, and
  server-side booking gating without relogin; production delivery remains
  intentionally disabled until a provider is approved;

- unique 30-minute room-slot ownership and `BEGIN IMMEDIATE` allow exactly
  one winner under concurrent booking requests;
- authenticated booking API integration tests cover creation, validation,
  conflict, safe DTOs, ownership, cancellation, and personal reads;
- the enhanced mobile schedule provides a one-day phone timeline, date strip,
  month picker, bottom sheets, safe-area clearance, and a three-day tablet
  view.
- the room-capacity filter persists canonical `minCapacity` URL state,
  filters the full API room list, resolves selected-room fallback and no-match
  states, preserves browser history/date context, and invalidates stale
  booking-form or cancellation state across room changes.

Docker Compose source is present for the API, web, and public Caddy gateway
with an API-owned persistent SQLite volume. `docker compose config --quiet`
passes. The current Phase 4A environment could not reconnect to its Colima
Docker socket, so a fresh image build/start/restart smoke remains unverified
in this review despite earlier project-phase gateway evidence.

Deferred to later bonus phases:

- recurring weekly bookings;
- end-of-booking in-app notifications;
- installable/offline PWA and Web Push.

## Known limitations

- The SQLite deployment deliberately supports one API writer process and is
  not horizontally scalable.
- Office hours apply every calendar day because the specification defines no
  closed weekdays.
- Expired sessions are rejected but do not yet have scheduled cleanup.
- Login throttling is not implemented.
- Cancelled records remain persisted for integrity but are excluded from the
  default schedule and personal lists.
- Past-booking cursors are process-keyed and become invalid after an API
  restart.
- Dark mode is not claimed; the verified submission theme is light.

## Workspace projects

Libraries are domain-first. Within `auth`, `booking`, and `rooms`, domains
remain at the scope root, server projects live under `server/`, and web
projects live under `web/` (with user workflows in `web/features/`). Shared
libraries are grouped by runtime under `agnostic/`, `server/`, and `web/`.
The one intentional exception is `libs/shared/config`: its root is agnostic
and exposes runtime-neutral validation only; its protected `/node` entrypoint
is the sole public boundary for Node environment-file loading. `shared-i18n`
likewise exposes web-safe locale contracts at its root, while
`/server` exclusively owns the Next.js `server-only` dictionary loader. These
grouping folders are not Nx projects; tags and `yarn audit:boundaries` enforce
the same layout and transitive entrypoint isolation.
See [libs/README.md](libs/README.md) for the compact map.

| Project                           | Location                                    | Nx tags                                             |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| `web`                             | `apps/web`                                  | `scope:app,type:app,platform:web`                   |
| `api`                             | `apps/api`                                  | `scope:app,type:app,platform:server`                |
| `workspace-tooling`               | `tools`                                     | `scope:workspace,type:tooling,platform:server`      |
| `shared-config`                   | `libs/shared/config`                        | `scope:shared,type:util,platform:agnostic`          |
| `shared-database`                 | `libs/shared/server/database`               | `scope:shared,type:infrastructure,platform:server`  |
| `shared-date-time`                | `libs/shared/agnostic/date-time`            | `scope:shared,type:util,platform:agnostic`          |
| `shared-error-handling`           | `libs/shared/agnostic/error-handling`       | `scope:shared,type:util,platform:agnostic`          |
| `shared-i18n`                     | `libs/shared/web/i18n`                      | `scope:shared,type:util,platform:web`               |
| `shared-ui`                       | `libs/shared/web/ui`                        | `scope:shared,type:ui,platform:web`                 |
| `booking-domain`                  | `libs/booking/domain`                       | `scope:booking,type:domain,platform:agnostic`       |
| `booking-infrastructure`          | `libs/booking/server/infrastructure`        | `scope:booking,type:infrastructure,platform:server` |
| `booking-data-access`             | `libs/booking/server/data-access`           | `scope:booking,type:data-access,platform:server`    |
| `booking-application`             | `libs/booking/server/application`           | `scope:booking,type:application,platform:server`    |
| `booking-data-access-web`         | `libs/booking/web/data-access`              | `scope:booking,type:data-access,platform:web`       |
| `booking-feature-schedule`        | `libs/booking/web/features/schedule`        | `scope:booking,type:feature,platform:web`           |
| `booking-feature-my-bookings`     | `libs/booking/web/features/my-bookings`     | `scope:booking,type:feature,platform:web`           |
| `booking-ui`                      | `libs/booking/web/ui`                       | `scope:booking,type:ui,platform:web`                |
| `rooms-domain`                    | `libs/rooms/domain`                         | `scope:rooms,type:domain,platform:agnostic`         |
| `rooms-infrastructure`            | `libs/rooms/server/infrastructure`          | `scope:rooms,type:infrastructure,platform:server`   |
| `rooms-data-access`               | `libs/rooms/server/data-access`             | `scope:rooms,type:data-access,platform:server`      |
| `auth-domain`                     | `libs/auth/domain`                          | `scope:auth,type:domain,platform:agnostic`          |
| `auth-infrastructure`             | `libs/auth/server/infrastructure`           | `scope:auth,type:infrastructure,platform:server`    |
| `auth-data-access`                | `libs/auth/server/data-access`              | `scope:auth,type:data-access,platform:server`       |
| `auth-data-access-web`            | `libs/auth/web/data-access`                 | `scope:auth,type:data-access,platform:web`          |
| `auth-application`                | `libs/auth/server/application`              | `scope:auth,type:application,platform:server`       |
| `auth-feature-access`             | `libs/auth/web/features/access`             | `scope:auth,type:feature,platform:web`              |
| `auth-feature-email-verification` | `libs/auth/web/features/email-verification` | `scope:auth,type:feature,platform:web`              |
| `auth-ui`                         | `libs/auth/web/ui`                          | `scope:auth,type:ui,platform:web`                   |

Persistence schemas are scope-owned and available only through explicit
infrastructure entry points:

- `@mr-booking/auth-infrastructure/schema`;
- `@mr-booking/booking-infrastructure/schema`;
- `@mr-booking/rooms-infrastructure/schema`.

Booking seed tooling uses `@mr-booking/booking-data-access/seed`; runtime
data-access roots do not expose schema or seed internals.

Platform tags are enforced as `web -> web/agnostic`,
`server -> server/agnostic`, and `agnostic -> agnostic`. Run
`yarn audit:boundaries` to validate project tags, physical roots, the Nx
graph, exact cross-scope exceptions, and protected public entrypoints.
`verify:commit` runs this audit before the full quality suite.

## Responsive schedule and timezone responsibilities

Below 640px the schedule renders one browser-local day with a seven-day strip,
month picker, sticky context, and mobile booking/details sheets. From
640–1023px it renders the selected day plus two days. From 1024px it renders
the full Monday–Sunday week. All modes share one selected room/date model and
one range-specific SWR resource; they do not fetch all presentations at once.

The browser timezone controls all visible schedule and My Bookings labels.
`booking-feature-schedule` owns schedule range/navigation models and
schedule-specific formatting; `booking-ui` owns reusable booking presentation
and the browser-only timezone hook shared by both booking features. The API
receives and returns absolute ISO timestamps, stores UTC instants, and always
validates slot alignment and 09:00–19:00 office policy in `Europe/Kyiv`. When
browser and office zones differ, booking surfaces show both responsibilities
explicitly.
