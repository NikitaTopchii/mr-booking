# Nx Architecture Rules

Nx is the mandatory monorepo orchestrator. `apps/web` and `apps/api` are
composition roots. Applications MAY contain bootstrap, routes, layouts,
providers, environment wiring, and composition; reusable business logic MUST
live in an owning library.

## Feature-first ownership

Libraries MUST be feature-first and domain-scoped. Expected scopes are
`auth`, `rooms`, `booking`, `notifications`, `pwa`, and `shared`. Expected
types are `domain`, `feature`, `ui`, `data-access`, `infrastructure`, and
`util`.

A feature is an independently meaningful user or business capability, not a
file-size category. Examples include register, log in, view weekly schedule,
create booking, cancel booking, and view personal bookings. Do not create an
empty library before real code needs it.

`shared` MUST NOT become a dumping ground. Domain-specific code remains in its
owning domain. Generic shared code MUST have no dependency on a feature.

## Tags and boundaries

Every project MUST carry one relevant tag from each applicable group:

- scope: `scope:shared`, `scope:auth`, `scope:rooms`, `scope:booking`,
  `scope:notifications`, or `scope:pwa`;
- type: `type:app`, `type:domain`, `type:feature`, `type:ui`,
  `type:data-access`, `type:infrastructure`, or `type:util`;
- platform: `platform:web`, `platform:api`, or `platform:shared`.

`@nx/enforce-module-boundaries` MUST remain an error. Dependency direction is
approximately:

```text
app -> feature -> ui / data-access -> domain -> shared
```

Infrastructure implements inward-defined ports. Domain libraries MUST NOT
depend on UI, features, data access, infrastructure, Next.js, NestJS, Drizzle,
or browser APIs.

Web projects may depend only on web/shared platform code; API projects may
depend only on API/shared platform code. Shared platform code MUST remain
platform-neutral.

Cross-library imports MUST use public entry points. Deep imports into another
library and project/source dependency cycles are prohibited. Do not conceal a
cycle by moving domain code into `shared` or weakening constraints.
