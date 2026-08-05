# Nx Architecture Rules

Nx is the mandatory monorepo orchestrator. `apps/web` and `apps/api` are
composition roots. Applications MAY contain bootstrap, routes, layouts,
providers, environment wiring, and composition; reusable business logic MUST
live in an owning library.

## Feature-first ownership

Libraries MUST be feature-first and domain-scoped. A feature is an
independently meaningful user or business capability, not a file-size category.
Do not create an empty library before real code needs it.

`shared` MUST NOT become a dumping ground. Domain-specific code remains in its
owning scope and generic shared code MUST have no dependency on a feature.
`scope:app` identifies application roots that compose multiple real scopes;
`scope:workspace` identifies repository tooling. Neither means that the
application or tooling itself is shared business code.

## Tags and boundaries

Every project carries exactly one tag in each dimension:

- scope: `scope:app`, `scope:workspace`, `scope:shared`, `scope:auth`,
  `scope:booking`, or `scope:rooms`;
- type: `type:app`, `type:feature`, `type:application`, `type:api`,
  `type:domain`, `type:data-access`, `type:infrastructure`, `type:ui`,
  `type:util`, `type:testing`, or `type:tooling`;
- platform: `platform:web`, `platform:server`, or `platform:agnostic`.

Only tags that describe a real project may be assigned. `type:api` and
`type:testing` are reserved vocabulary until a project requires them.

`@nx/enforce-module-boundaries` MUST remain an error. Its coarse constraints
are supplemented by `yarn audit:boundaries`, which reads the current Nx graph,
checks cycles, validates every tag and dependency direction, and enforces the
exact cross-scope allowlist and protected entrypoints. `verify:commit` runs the
audit before the normal test and quality suites.

Platform direction is strict:

```text
web       -> web, agnostic
server    -> server, agnostic
agnostic  -> agnostic
```

The type direction is intentionally conservative:

```text
app          -> application / feature / api / ui / data-access / infrastructure / domain / util
application  -> domain / util
api          -> application / data-access / infrastructure / domain / util
feature      -> ui / data-access / domain / util
ui           -> ui / domain / util
data-access  -> application / infrastructure / domain / util
infrastructure -> infrastructure / domain / util
domain       -> domain / util
util         -> util
```

`type:tooling` and future `type:testing` are server-side support boundaries;
they may consume only the lower-level types needed for their real commands and
tests. A production app MUST NOT import a testing entrypoint.

Scope direction is also enforced: `shared` depends only on `shared`; `auth`
and `rooms` depend only on themselves and `shared`; `booking` may use its own
scope and `shared` plus only the exact `auth`/`rooms` graph edges recorded by
the audit. Application and workspace composition roots may compose existing
business scopes, but the audit records their current direct cross-scope edges
as exact pairs rather than allowing a wildcard exception.

## Application and persistence direction

Backend application libraries own CQRS commands, queries, handlers, and
use-case orchestration over domain ports. They MUST NOT import data-access,
infrastructure, database, runtime configuration, or persistence `/schema`
entrypoints. Concrete Nest provider composition belongs in `apps/api`.

Infrastructure implements inward-defined ports. Authoritative persistence
schemas are available only through their owning `/schema` entrypoint.
`booking-infrastructure` may use the auth and rooms schema entrypoints for its
documented foreign keys; `booking-data-access` may use the same schema
entrypoints for actual joins. No other cross-scope schema imports are allowed
outside focused API/tooling test assertions.

The protected entrypoint policy is enforced from source imports:

- web code never imports persistence schemas, database code, or the Node-only
  configuration entrypoint;
- features never import Next server-only entrypoints;
- only `apps/web` Server Components import
  `auth-data-access-web/server` and `shared-i18n/server`;
- `shared-config` root is agnostic because it validates a supplied environment;
  its `/node` entrypoint is server-only and is limited to API/database/tooling;
- `booking-data-access/seed` is limited to workspace tooling and its tests.

`auth-data-access-web/server` is a Next.js server-runtime web boundary, not an
API persistence boundary. `shared-i18n/server` is likewise web-only despite
being server-rendered. These explicit subpaths preserve truthful project tags
without permitting their use from Client Components or NestJS.

Cross-library imports MUST use public entrypoints. Deep imports, source
dependency cycles, compatibility schema barrels, and moving domain code into
`shared` to evade a boundary are prohibited.

## Physical library layout

The filesystem makes the same ownership visible as project tags. `auth`,
`booking`, and `rooms` remain domain-first: an agnostic domain project lives
at `libs/<scope>/domain`, server projects under `libs/<scope>/server`, and web
projects under `libs/<scope>/web`. User-facing web feature projects live below
`libs/<scope>/web/features`.

Shared agnostic, server, and web projects live below
`libs/shared/agnostic`, `libs/shared/server`, and `libs/shared/web`.
`libs/shared/config` is the sole approved root exception because its agnostic
root has a protected server-only `/node` entrypoint. Do not split it or add a
new root exception without an ownership decision.

`server`, `web`, `agnostic`, and `features` are grouping directories, never
Nx projects. `yarn audit:boundaries` validates roots, source roots, nesting,
and package aliases alongside tags and graph direction. Imports remain public
`@mr-booking/*` aliases rather than filesystem paths.
