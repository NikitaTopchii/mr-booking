# ADR 0013: Nx Taxonomy and Boundary Enforcement

- **Status:** Accepted

## Context

The previous `platform:api` and `platform:shared` labels mixed runtime
placement with scope ownership. Applications and workspace tooling were also
tagged `scope:shared` even though they compose multiple business scopes. Nx
constraints expressed broad directions but could not represent the small,
documented booking-to-auth/rooms persistence and presentation dependencies.

## Decision

Every current Nx project uses one scope, type, and platform tag. The platform
vocabulary is:

```text
platform:web       browser and Next.js web-runtime code
platform:server    NestJS, persistence, and command-line/server code
platform:agnostic  runtime-neutral contracts and utilities
```

`apps/api` and `apps/web` use `scope:app,type:app`; `tools` uses
`scope:workspace,type:tooling`. This records their composition role without
misclassifying them as shared business code.

The architecture uses two enforcement layers:

1. `@nx/enforce-module-boundaries` applies coarse scope, type, and platform
   direction to every source import.
2. `yarn audit:boundaries` reads the generated Nx graph and source imports. It
   validates the tag vocabulary, cycles, exact cross-scope pairs, and protected
   entrypoints. It runs from `verify:commit`.

The booking cross-scope allowlist is intentionally small: booking application
may use auth/rooms domains; booking infrastructure may use auth/rooms schema
owners; booking data access may use the auth/rooms domain and schema owners
needed for current joins; Schedule and My Bookings may use `auth-ui` for the
shared expiry redirect. Application and tooling composition edges are also
enumerated by their current project pairs rather than covered by a wildcard.

`shared-config` root remains agnostic because parsing a caller-provided
environment has no runtime-side effect. Its explicit `/node` entrypoint is
the sole public entrypoint for environment-file loading and Node-specific
helpers. The root barrel MUST NOT transitively reach `node:fs`, `node:path`,
`node:process`, or the Node loader.

`shared-i18n` root exposes only locale contracts, dictionary types, and
web-safe helpers. Its explicit `/server` entrypoint is the sole public
entrypoint for the `server-only` dictionary loader. The root barrel MUST NOT
transitively reach `server-only` or `getDictionary`.

Protected subpaths are exclusive runtime boundaries, not convenience aliases
for symbols also exported from the root. `auth-data-access-web/server` and
`shared-i18n/server` remain web-tagged Next server-runtime boundaries; they are
not NestJS/persistence code.

## Consequences

Platform violations become visible before build and the historical persistence
exceptions remain reviewable. The boundary audit follows root entrypoint
re-exports and path aliases transitively, and rejects protected-entrypoint
imports from unauthorized projects with the allowed consumers and replacement
entrypoint in the failure message. Recurring bookings, when actually implemented,
remain `scope:booking`: its use cases belong in `booking-application`, schema
in `booking-infrastructure`, persistence adapters in `booking-data-access`,
and browser interaction in a real booking feature only if one is warranted.
No recurring, notification, or placeholder library is created by this
decision.

## Deferred work

ADR 0014 applies the physical domain/server/web grouping that corresponds to
this taxonomy. A future project changes the exact allowlist only with the
related ownership decision, source-level policy, and regression test.
