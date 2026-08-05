# Nx Dependency Map

Nx projects use feature-first ownership and the enforced direction:

```text
app
  -> application / feature
      -> ui / data-access
          -> domain
              -> shared
```

Applications are composition roots:

- `apps/web` wires Next.js routing, providers, and web features;
- `apps/api` wires NestJS modules, infrastructure adapters, and handlers.

Applications do not own reusable business logic.

## Expected scopes

- `auth`;
- `rooms`;
- `booking`;
- `shared`;
- `notifications` only when that bonus is implemented;
- `pwa` only when that bonus is implemented.

Each real Nx project uses applicable `scope:*`, `type:*`, and `platform:*`
tags defined in `docs/agent-rules/nx-architecture.md`.

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
prohibited. Web cannot import API-only code; API cannot import browser code.

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
Web: auth-feature-web -> auth-ui / auth-data-access-web -> auth-domain
                     -> shared-ui
App routes -> shared-i18n/server

Email verification is a separate web feature boundary:

```text
auth-feature-email-verification
  -> auth-data-access-web/client
  -> auth-domain (safe user contracts)
  -> shared-feature-error / shared-i18n / shared-ui
````

The booking write foundation adds:

```text
apps/api
  -> booking-application -> booking-domain
  -> booking-data-access -> booking-domain
                         -> auth-infrastructure / rooms-infrastructure
                         -> shared-database
  -> rooms-data-access -> rooms-domain
  -> auth-data-access -> auth-domain
```

`auth-infrastructure` and `rooms-infrastructure` own only their feature's
Drizzle table declarations. This lets booking foreign keys reuse authoritative
schemas while preserving the prohibition on data-access-to-data-access
imports. `rooms-domain` owns the focused room-existence port; it has no booking
dependency.

`auth-data-access` owns Drizzle, SQLite, Argon2, and session persistence.
`auth-data-access-web` owns browser HTTP parsing and server-side current-user
resolution through the NestJS API. Their public entry points are separate, so
the web graph cannot transitively include API persistence.

This map does not predeclare a library per box. Create a library only when it
owns real code, has a meaningful boundary, and benefits from independent
testing or dependency enforcement.
