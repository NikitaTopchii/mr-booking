# MR Booking

MR Booking is an Nx monorepo for the UA-SKILLS meeting-room booking
application. Phase 1A provides the production-shaped runtime foundation:

```text
Browser -> Caddy -> Next.js web -> NestJS API -> SQLite
```

The current phase includes environment validation, committed Drizzle
migrations, deterministic room seeds, health checks, Docker images, and
quality gates. Authentication, users, bookings, CQRS use cases, and the
calendar UI are deliberately deferred.

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

## Local development

Start the web and API development servers:

```bash
yarn dev
```

This command validates the environment, applies migrations, optionally seeds
rooms when `SEED_ON_START=true`, and then starts both Nx applications. The
default local URLs are:

- Web: `http://localhost:3001`
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

Apply committed migrations and run the idempotent room seed:

```bash
yarn db:migrate
yarn db:seed
```

The seed owns six stable room records: Акваріум, Марс, Гагарін, Орбіта,
Дніпро, and Київ. Re-running it updates those stable records safely, creates
no duplicates, and does not delete user-created rooms.

Test users and demo bookings will be introduced only in later phases, after
password hashing and the booking schema exist.

## Quality checks

Run individual checks:

```bash
yarn test
npm test
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

## Workspace projects

| Project             | Location                 | Nx tags                                         |
| ------------------- | ------------------------ | ----------------------------------------------- |
| `web`               | `apps/web`               | `scope:shared,type:app,platform:web`            |
| `api`               | `apps/api`               | `scope:shared,type:app,platform:api`            |
| `shared-config`     | `libs/shared/config`     | `scope:shared,type:util,platform:shared`        |
| `shared-database`   | `libs/shared/database`   | `scope:shared,type:infrastructure,platform:api` |
| `rooms-data-access` | `libs/rooms/data-access` | `scope:rooms,type:data-access,platform:api`     |
| `workspace-tooling` | `tools`                  | `scope:shared,type:app,platform:api`            |

## Phase status

Phase 1A is limited to the workspace and runtime foundation. It intentionally
does not include authentication, authorization, registration, sessions,
bookings, booking slots, CQRS handlers, SWR, shadcn/ui, the weekly calendar,
PWA support, notifications, Web Push, or recurring bookings. Dependencies for
those features are not installed in this phase.
