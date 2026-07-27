# Nx Dependency Map

Nx projects use feature-first ownership and the enforced direction:

```text
app
  -> feature
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
- `feature` coordinates a user or application capability.
- `ui` renders reusable presentation for its owning scope.
- `data-access` handles API-facing client state or application persistence
  ports, depending on platform.
- `infrastructure` implements inward-defined ports.
- `shared` contains only truly cross-domain, platform-appropriate code.

Cross-library imports use public entry points. Deep imports and cycles are
prohibited. Web cannot import API-only code; API cannot import browser code.

Authentication makes the platform split explicit:

```text
API: auth-feature -> auth-data-access -> auth-domain
Web: auth-feature-web -> auth-ui / auth-data-access-web -> auth-domain
                     -> shared-ui
App routes -> shared-i18n/server
```

The booking write foundation adds:

```text
booking-feature
  -> booking-domain
  -> booking-data-access -> booking-domain
                         -> auth-infrastructure / rooms-infrastructure
                         -> shared-database
  -> rooms-domain / rooms-data-access
  -> auth-domain / auth-data-access for composition-time Clock/UUID aliases
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
