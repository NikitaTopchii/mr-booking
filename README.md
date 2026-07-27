# MR Booking

MR Booking is an Nx monorepo for the UA-SKILLS meeting-room booking
application. Phase 2 adds complete password and session authentication to the
production-shaped runtime foundation:

```text
Browser -> Caddy -> Next.js web -> NestJS API -> SQLite
```

The current phase includes registration with automatic login, login, logout,
server-restored protected routes, Argon2id password hashes, opaque
database-backed sessions, deterministic users and rooms, health checks,
Docker images, and quality gates. Bookings and the calendar remain deferred.

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

Passwords are seeded through the same production Argon2id adapter. Demo
bookings remain deferred until the booking schema exists.

## Authentication behavior

- `POST /api/auth/register` creates the user and first session atomically.
- `POST /api/auth/login` creates an independent session.
- `GET /api/auth/me` resolves the current unexpired session.
- `POST /api/auth/logout` idempotently deletes only the current session and
  clears its cookie.
- `/uk/schedule` and `/en/schedule` are localized minimal protected shells.
  Unprefixed application routes redirect to the saved locale or Ukrainian by
  default. Auth pages and protected layouts redirect on the server based on
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

| Project                | Location                    | Nx tags                                         |
| ---------------------- | --------------------------- | ----------------------------------------------- |
| `web`                  | `apps/web`                  | `scope:shared,type:app,platform:web`            |
| `api`                  | `apps/api`                  | `scope:shared,type:app,platform:api`            |
| `shared-config`        | `libs/shared/config`        | `scope:shared,type:util,platform:shared`        |
| `shared-database`      | `libs/shared/database`      | `scope:shared,type:infrastructure,platform:api` |
| `shared-i18n`          | `libs/shared/i18n`          | `scope:shared,type:util,platform:web`           |
| `shared-ui`            | `libs/shared/ui`            | `scope:shared,type:ui,platform:web`             |
| `rooms-data-access`    | `libs/rooms/data-access`    | `scope:rooms,type:data-access,platform:api`     |
| `auth-domain`          | `libs/auth/domain`          | `scope:auth,type:domain,platform:shared`        |
| `auth-data-access`     | `libs/auth/data-access`     | `scope:auth,type:data-access,platform:api`      |
| `auth-data-access-web` | `libs/auth/data-access-web` | `scope:auth,type:data-access,platform:web`      |
| `auth-feature`         | `libs/auth/feature`         | `scope:auth,type:feature,platform:api`          |
| `auth-feature-web`     | `libs/auth/feature-web`     | `scope:auth,type:feature,platform:web`          |
| `auth-ui`              | `libs/auth/ui`              | `scope:auth,type:ui,platform:web`               |
| `workspace-tooling`    | `tools`                     | `scope:shared,type:app,platform:api`            |

## Phase status

Phase 2 completes mandatory authentication only. Password recovery/change,
OAuth, magic links, MFA, CAPTCHA, roles/admin, email verification, account
deletion, device management, and logout-all are intentionally deferred.
Bookings, booking permissions, calendar behavior, SWR, PWA support,
notifications, Web Push, and recurring bookings are also outside this phase.
Login throttling and expired-session cleanup are documented hardening work,
not placeholder implementations.
