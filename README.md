# MR Booking

MR Booking is a web application for booking meeting rooms. Users can view the
weekly schedule in their browser timezone, filter rooms by capacity, create and
cancel their own bookings, and review booking history. The current scope does
not include recurring bookings or end-of-booking notifications.

## Requirements

- Node.js `>=24.0.0 <25` — pinned in `package.json` and `.nvmrc` (`24`).
- Corepack and Yarn `4.17.1` — the version is pinned in `package.json`.
- Docker path: Docker with Docker Compose.
- Local path: Node.js and Corepack/Yarn as documented below.

Check the versions before installation:

```bash
corepack enable
node --version
yarn --version
```

Node 24 and Yarn `4.17.1` are expected.

## Quick start with Docker

The Docker flow is the primary review path for the Docker bonus. It requires
only Docker and Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

The Compose stack intentionally runs the local demo in development mode. Its
development email verification link is logged by the API, and the public link
uses the gateway at `http://localhost:3000`. Host-level `NODE_ENV` and
production email settings cannot change this demo-only Compose mode. The
application mode is controlled by `APP_RUNTIME_MODE`; `NODE_ENV` may still be
set to `production` internally by the optimized Next.js server. This stack is
not a production deployment: it has no SMTP delivery or HTTPS termination.

After the containers are ready:

- Web: <http://localhost:3000>;
- API through the public gateway: <http://localhost:3000/api>;
- API health: <http://localhost:3000/api/health/ready>;
- Web health: <http://localhost:3000/health>.

The API entrypoint validates the environment, applies committed migrations,
and runs the deterministic room, user, and booking seed before the API becomes
healthy. The SQLite database, WAL, and SHM files are stored in the persistent
Compose volume `sqlite_data`. The gateway waits for both API and web health
checks before accepting traffic.

Stop the application while preserving the local volume:

```bash
docker compose down
```

Stop the application and delete its local database volume:

```bash
docker compose down -v
```

The Compose configuration is implemented and parses successfully. A clean
runtime startup remains marked unverified when the local Docker daemon is
unavailable; the command above is the intended one-command Docker scenario.

## Local development without Docker

Run these commands from the repository root:

```bash
yarn install --immutable
cp .env.example .env
yarn db:migrate
yarn db:seed
yarn dev
```

`yarn dev` starts the API and web applications through Nx. Keep the terminal
open; press `Ctrl+C` to stop them. The migration and seed commands are safe to
run repeatedly. `SEED_ON_START=true` also ensures rooms and demo data are
available when the API starts.

## Local application addresses

Main local web application:

- application: <http://localhost:3001>;
- Ukrainian login: <http://localhost:3001/uk/login>;
- Ukrainian registration: <http://localhost:3001/uk/register>;
- web health: <http://localhost:3001/health>.

The API listens on <http://localhost:3002>:

- liveness: <http://localhost:3002/api/health/live>;
- readiness: <http://localhost:3002/api/health/ready>.

In the browser, API requests go through the Next.js `/api` rewrite, so opening
the web address is sufficient to use the application.

## Test users

`yarn db:seed` creates these development users through Argon2id:

| User  | Email               | Password      | State    |
| ----- | ------------------- | ------------- | -------- |
| Alice | `alice@example.com` | `password123` | verified |
| Bob   | `bob@example.com`   | `password123` | verified |

These credentials are for local demos only. The system has no separate role
model for these users.

## Database and seed

The local database is a SQLite file at `.data/mr-booking.sqlite`; its path is
configured through `DATABASE_PATH` in `.env`.

```bash
yarn db:migrate
yarn db:seed
```

`yarn db:migrate` applies the committed Drizzle migrations. `yarn db:seed`
creates or updates six stable rooms, two demo users, six demo bookings, and
their 30-minute slot rows. The seed is idempotent and does not delete
user-created records. For a stable review week, set `DEMO_SEED_WEEK_START` in
`.env` to a Monday in `YYYY-MM-DD` format.

There is no separate command for deleting the local SQLite database; use a
different `DATABASE_PATH` for a clean local run. Do not manually delete the
database files during normal operation.

## Email verification in development

After registration, the application opens the email verification page.

Click **“Verify email”** — in development mode, the application uses a
generated link without a real SMTP provider.

After verification, the user can create bookings. Before verification, the user
can view rooms and the schedule but cannot book.

For bonus verification, the same link is also printed to the API console:

`[email-verification:development] Verification link for user ...`

## Tests

Main reviewer commands:

```bash
docker compose config --quiet
npm test
yarn test:integration
yarn test:e2e --retries=0
yarn lint
yarn typecheck
yarn build
yarn format:check
yarn audit:boundaries
yarn audit:cohesion
```

Full sequential gate:

```bash
yarn verify:commit
```

## Implemented bonuses

The statuses below are based on the tests and runtime checks completed for this
submission:

| Bonus                              | Status                     | Evidence                                                          |
| ---------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| Development email verification     | IMPLEMENTED AND VERIFIED   | API log adapter, unverified booking gate, E2E auth flow           |
| Race-safe booking                  | IMPLEMENTED AND VERIFIED   | concurrent API test: exactly `201` and `409`                      |
| Booking API integration tests      | IMPLEMENTED AND VERIFIED   | API controller/integration suites                                 |
| Room-capacity filter               | IMPLEMENTED AND VERIFIED   | `schedule-capacity.spec.ts`, repeated no-retry E2E                |
| Complete mobile scenario           | IMPLEMENTED AND VERIFIED   | mobile viewport, navigation, booking and cancellation E2E         |
| Docker Compose one-command startup | IMPLEMENTED BUT UNVERIFIED | Compose config parses, runtime blocked by Docker daemon I/O error |
| Weekly recurring bookings          | NOT IMPLEMENTED            | no recurring-series behavior exists                               |
| End-of-booking notifications       | NOT IMPLEMENTED            | no notification delivery or scheduler exists                      |

Docker is not claimed as a completed bonus without a successful clean runtime
startup.

## Protection against overlaps and races

Intervals use half-open semantics `[start, end)`: bookings from 10:00–11:00
and 11:00–12:00 are adjacent and do not overlap. Time, ownership, and
availability are validated on the server.

During creation, the API atomically reserves 30-minute rows in
`booking_slots` using SQLite `BEGIN IMMEDIATE`. A unique constraint on
`(room_id, slot_starts_at_utc)` prevents concurrent requests from claiming the
same slot: one operation creates the booking successfully and the other gets a
conflict.

## Time and timezone

Absolute timestamps arrive as ISO 8601 values, are stored in SQLite as integer
UTC epoch milliseconds, and are returned by the API as canonical UTC with `Z`.
Office rules are checked in `Europe/Kyiv` between 09:00 and 19:00; the server
clock is authoritative.

The calendar and My Bookings display times directly in the browser timezone.
Week navigation uses the browser-local date, while the API works with an
absolute UTC range. Weekly recurring bookings are not implemented.

## Known limitations

- SQLite is configured for one API writer and is not horizontally scalable.
- Office hours apply every calendar day because the specification does not
  define closed weekdays.
- Expired sessions are rejected but do not have scheduled cleanup.
- Login throttling is not implemented.
- Cancelled records remain persisted for integrity but are excluded from the
  default schedule and personal booking lists.
- Past-booking cursors are process-keyed and become invalid after an API
  restart.
- Recurring bookings, end-of-booking notifications, PWA installation, and Web
  Push are not implemented.

## Architecture

The repository is an Nx monorepo with a Next.js web application, NestJS API,
SQLite/Drizzle, and framework-neutral domain libraries. `libs/` follows a
domain-first layout; server/web/agnostic boundaries and public
`@mr-booking/*` aliases are checked by Nx rules and `yarn audit:boundaries`.

Further details are available in the supporting documentation:

- [Library layout](libs/README.md);
- [Dependency map](docs/architecture/dependency-map.md);
- [Architecture decisions](docs/architecture/adr/).

## Submission scope

The repository contains a meaningful phased commit history. This README
describes only the available local-development flow and verified bonuses.
Schema, migrations, API contracts, and application behavior were not changed
as part of the README preparation.
