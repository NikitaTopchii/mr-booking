# MR Booking

MR Booking is an Nx monorepo for the UA-SKILLS meeting-room booking
application. The current foundation combines password/session authentication
with the authoritative booking HTTP and persistence core:

```text
Browser -> Caddy -> Next.js web -> NestJS API -> SQLite
```

The current phase includes registration with automatic login, login, logout,
server-restored protected routes, Argon2id password hashes, opaque
database-backed sessions, deterministic users and rooms, health checks,
race-safe booking commands, authenticated room/schedule/booking endpoints,
Docker images, and quality gates. The weekly calendar UI remains deferred.

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

Authentication adds:

| Variable              | Local default          | Purpose                             |
| --------------------- | ---------------------- | ----------------------------------- |
| `SESSION_COOKIE_NAME` | `room_booking_session` | HttpOnly opaque-session cookie name |
| `SESSION_TTL_DAYS`    | `7`                    | Fixed session lifetime in days      |

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

Apply committed migrations and run the idempotent room/auth seed:

```bash
yarn db:migrate
yarn db:seed
```

The seed owns six stable room records: Акваріум, Марс, Гагарін, Орбіта,
Дніпро, and Київ. Re-running it updates those stable records safely, creates
no duplicates, and does not delete user-created rooms.

The seed also creates missing demo users without changing an existing matching
account or resetting its password:

| Name  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Alice | `alice@example.com` | `password123` |
| Bob   | `bob@example.com`   | `password123` |

Passwords are seeded through the same production Argon2id adapter. Phase 3A
adds the booking schema but intentionally does not seed demo bookings; those
arrive with the schedule and personal-list integration.

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

Authentication dictionaries live in `libs/shared/i18n`. They are typed,
dynamically imported by Server Components, and never loaded in Client
Components. API validation returns stable field codes; the active dictionary
provides user-facing text.

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

My bookings currently provides localized Upcoming and Past UI foundations
with deliberate empty-state copy and a localized Schedule action. It does not
query or persist bookings and does not contain mock booking rows. Ordering,
pagination, cancellation, timezone formatting, and room/week navigation are
not connected in Phase 3B.

## Booking API and command foundation

Phase 3B exposes the Phase 3A authoritative write core through four
session-authenticated endpoints:

- `GET /api/rooms` returns safe room metadata in deterministic floor/name
  order;
- `GET /api/rooms/:roomId/bookings?fromUtc=2030-06-03T06%3A00%3A00.000Z&toUtc=2030-06-10T06%3A00%3A00.000Z`
  returns active bookings overlapping the requested half-open absolute range;
- `POST /api/bookings` creates a booking for the session user;
- `DELETE /api/bookings/:bookingId` cancels an owned future booking and
  returns `204`.

Booking request timestamps are ISO 8601 absolute datetime strings with `Z` or
an explicit offset, for example `2030-06-03T09:00:00.000+03:00`. Responses
normalize every booking timestamp to canonical UTC such as
`2030-06-03T06:00:00.000Z`. Datetimes without timezone information are
rejected. Query-string datetime values must be URL-encoded when they contain
an explicit `+` offset.
The browser schedule chooses its Monday–Sunday URL week in the browser
timezone, derives the corresponding office slots as absolute instants, and
sends canonical ISO 8601 range parameters. Booking creation validity is still
evaluated authoritatively in `Europe/Kyiv`.
Schedule reads exclude cancelled bookings and return only author ID/name.
`isMine` is server-derived, and booking-slot rows are never public.

The authoritative booking rules remain:

- titles are trimmed, Unicode-preserving, required, and limited to 100
  characters;
- absolute instants are integer UTC epoch milliseconds;
- the server clock requires a strictly future start;
- office policy is evaluated in `Europe/Kyiv`, every day from 09:00 through
  19:00;
- boundaries use a 30-minute grid and duration is 30 minutes through four
  hours;
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

Phase 2C release verification also covers a clean Docker image build, public
gateway registration and login, production cookie attributes, current-user
lookup, protected rendering, browser reload, logout/revocation, Alice and Bob
login, and session persistence across a normal Docker Compose restart.

## Workspace projects

| Project                   | Location                       | Nx tags                                         |
| ------------------------- | ------------------------------ | ----------------------------------------------- |
| `web`                     | `apps/web`                     | `scope:shared,type:app,platform:web`            |
| `api`                     | `apps/api`                     | `scope:shared,type:app,platform:api`            |
| `shared-config`           | `libs/shared/config`           | `scope:shared,type:util,platform:shared`        |
| `shared-database`         | `libs/shared/database`         | `scope:shared,type:infrastructure,platform:api` |
| `shared-i18n`             | `libs/shared/i18n`             | `scope:shared,type:util,platform:web`           |
| `shared-ui`               | `libs/shared/ui`               | `scope:shared,type:ui,platform:web`             |
| `booking-domain`          | `libs/booking/domain`          | `scope:booking,type:domain,platform:shared`     |
| `booking-data-access`     | `libs/booking/data-access`     | `scope:booking,type:data-access,platform:api`   |
| `booking-feature`         | `libs/booking/feature`         | `scope:booking,type:feature,platform:api`       |
| `booking-data-access-web` | `libs/booking/data-access-web` | `scope:booking,type:data-access,platform:web`   |
| `booking-feature-web`     | `libs/booking/feature-web`     | `scope:booking,type:feature,platform:web`       |
| `booking-ui`              | `libs/booking/ui`              | `scope:booking,type:ui,platform:web`            |
| `rooms-domain`            | `libs/rooms/domain`            | `scope:rooms,type:domain,platform:shared`       |
| `rooms-infrastructure`    | `libs/rooms/infrastructure`    | `scope:rooms,type:infrastructure,platform:api`  |
| `rooms-data-access`       | `libs/rooms/data-access`       | `scope:rooms,type:data-access,platform:api`     |
| `auth-domain`             | `libs/auth/domain`             | `scope:auth,type:domain,platform:shared`        |
| `auth-infrastructure`     | `libs/auth/infrastructure`     | `scope:auth,type:infrastructure,platform:api`   |
| `auth-data-access`        | `libs/auth/data-access`        | `scope:auth,type:data-access,platform:api`      |
| `auth-data-access-web`    | `libs/auth/data-access-web`    | `scope:auth,type:data-access,platform:web`      |
| `auth-feature`            | `libs/auth/feature`            | `scope:auth,type:feature,platform:api`          |
| `auth-feature-web`        | `libs/auth/feature-web`        | `scope:auth,type:feature,platform:web`          |
| `auth-ui`                 | `libs/auth/ui`                 | `scope:auth,type:ui,platform:web`               |
| `workspace-tooling`       | `tools`                        | `scope:shared,type:app,platform:api`            |

## Phase status

Phase 3C adds the localized interactive weekly schedule. The Server Component
route passes only its dictionary slice to an SWR-powered client boundary. The
manual Monday–Sunday grid renders 30-minute Kyiv office slots in the browser
timezone, persists `roomId` and Monday `week` in the URL, and supports room
selection, week navigation, creation, booking details, conflict refresh, and
owner cancellation. Browser responses are runtime-validated and every range
or mutation timestamp uses absolute ISO 8601 at the HTTP boundary.

Phase 3B completed the authenticated room catalogue, room-range schedule,
booking creation, and owner cancellation HTTP API. Real My bookings data
remains deliberately deferred.

Phase 2D completed the authenticated shell and My bookings UI foundation.
Password recovery/change, OAuth, magic links, MFA, CAPTCHA, roles/admin, email
verification, account deletion, device management, and logout-all are
intentionally deferred. Personal-list SWR, PWA support, notifications, Web
Push, and recurring bookings are outside Phase 3C.
Login throttling and expired-session cleanup are documented hardening work,
not placeholder implementations.
