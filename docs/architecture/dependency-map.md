# Nx Dependency Map

Nx projects use feature-first ownership and a two-part enforced direction:

```text
app / workspace composition
  -> application / feature / data-access / infrastructure
      -> domain / util
```

Applications are composition roots:

- `apps/web` wires Next.js routing, providers, and web features;
- `apps/api` wires NestJS modules, infrastructure adapters, and handlers.

Applications do not own reusable business logic.

Projects have one platform tag with strict direction:

```text
web -> web, agnostic
server -> server, agnostic
agnostic -> agnostic
```

## Expected scopes

- `auth`;
- `rooms`;
- `booking`;
- `shared`;
- `app` for application composition roots;
- `workspace` for repository tooling.

Each real Nx project uses applicable `scope:*`, `type:*`, and `platform:*`
tags defined in `docs/agent-rules/nx-architecture.md`.

## Physical layout

The library tree is domain-first. `auth`, `booking`, and `rooms` keep domain
at `<scope>/domain`, place server code under `<scope>/server`, and place web
code under `<scope>/web`; web workflows are in `<scope>/web/features`.
`shared` uses `agnostic`, `server`, and `web` runtime groupings. These folders
are not Nx projects. `shared/config` is the documented mixed-entrypoint
exception: its root is agnostic and `/node` is server-only. ADR 0014 records
the layout, while the boundary audit enforces its agreement with tags.

## Boundary intent

- `domain` is framework-independent and depends only on domain/shared
  utilities.
- `application` owns backend commands, queries, handlers, and use-case
  orchestration over domain ports.
- `feature` coordinates a user-facing or browser business capability.
- `ui` renders reusable presentation for its owning scope.
- `data-access` handles API-facing client state or application persistence
  ports, depending on platform.
- `infrastructure` implements inward-defined ports.
- `shared` contains only truly cross-domain, platform-appropriate code.

Cross-library imports use public entry points. Deep imports and cycles are
prohibited. `yarn audit:boundaries` validates the real Nx graph, platform and
layer direction, project cycles, protected subpaths, and the exact current
cross-scope pairs. It complements the coarse Nx ESLint rules rather than
replacing them.

Booking's browser features are separate composition boundaries: the schedule
feature owns schedule navigation, room selection, filtering, and booking
surfaces; My Bookings owns upcoming and past booking lists. They share lower
layers but do not depend on each other.

The schedule feature also owns its range algorithms, slot and current-time
models, schedule presentation types, and schedule-only date/navigation
helpers. `booking-ui` contains reusable booking presentation and the
browser-only timezone hook used by both booking features. `shared-date-time`
remains platform-neutral and React-free. My Bookings owns its outbound link
adapter for opening a booking in the schedule route, so neither feature
imports the other.

Authentication makes the platform split explicit:

````text
API: auth-application -> auth-domain
     apps/api -> auth-application + auth-data-access
Web: auth-feature-access -> auth-ui / auth-data-access-web -> auth-domain
                     -> shared-ui
App routes -> shared-i18n/server

Email verification is a separate web feature boundary:

```text
auth-feature-email-verification
  -> auth-data-access-web/client
  -> auth-domain (safe user contracts)
  -> shared-error-handling / shared-i18n / shared-ui
````

The booking write foundation adds:

```text
apps/api
  -> booking-application -> booking-domain
  -> booking-data-access -> booking-domain
                         -> booking-infrastructure
                         -> auth-infrastructure / rooms-infrastructure
                         -> shared-database
  -> booking-infrastructure -> auth-infrastructure / rooms-infrastructure
  -> rooms-data-access -> rooms-domain
  -> auth-data-access -> auth-domain
```

`auth-infrastructure`, `booking-infrastructure`, and
`rooms-infrastructure` own their feature's Drizzle table declarations behind
explicit `/schema` entry points. Booking infrastructure reuses the
authoritative auth and rooms schemas through
`@mr-booking/*-infrastructure/schema` for foreign keys. This preserves the
prohibition on data-access-to-data-access imports; the cross-scope schema
dependency is documented and intentional.
`rooms-domain` owns the focused room-existence port; it has no booking
dependency.

`auth-data-access` owns Drizzle, SQLite, Argon2, and session persistence but
imports auth tables from `auth-infrastructure/schema` rather than re-exporting
them.
`booking-data-access` owns booking repositories/readers and provider wiring;
its root barrel does not expose booking tables or seed internals. The seed
tooling contract is available through its explicit `/seed` entry point. The
booking, auth, and rooms infrastructure roots do not act as schema
compatibility barrels.
`auth-data-access-web` owns browser HTTP parsing and server-side current-user
resolution through the NestJS API. Their public entry points are separate, so
the web graph cannot transitively include API persistence.

The only non-shared business-scope edges are explicitly audited:

```text
booking-application -> auth-domain, rooms-domain
booking-data-access -> auth-domain, auth-infrastructure, rooms-domain, rooms-infrastructure
booking-infrastructure -> auth-infrastructure, rooms-infrastructure
booking-feature-schedule -> auth-ui
booking-feature-my-bookings -> auth-ui
```

The API and workspace tooling are composition roots with their current direct
business-scope dependencies enumerated by the audit. This keeps a new
cross-scope import from becoming an accidental convention. Schema entrypoints
remain server-only: booking persistence owns the documented auth/rooms schema
edges, while API and tooling access schemas directly only from focused tests.
`shared-config` root is agnostic; its `/node` entrypoint is restricted to
API/database/tooling. `auth-data-access-web/server` and
`shared-i18n/server` are Next server-runtime entrypoints restricted to
`apps/web` Server Components.

This map does not predeclare a library per box. Create a library only when it
owns real code, has a meaningful boundary, and benefits from independent
testing or dependency enforcement.
