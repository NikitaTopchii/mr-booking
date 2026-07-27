# ADR 0002: Next.js and NestJS Boundary

- **Status:** Accepted

## Context

Next.js can execute server code, but duplicating backend authority would split
authentication, validation, and persistence behavior.

## Decision

NestJS is the authoritative application backend. Next.js owns routing,
rendering, browser display, and API consumption. It never imports
SQLite/Drizzle or reimplements authoritative booking rules.

## Alternatives considered

- Next.js route handlers as a second backend: rejected due to duplicated
  authority.
- Next.js-only full stack: rejected by the required technology baseline.
- Direct browser-to-database access: rejected for security and deployment.

## Consequences

All protected mutations and reads cross a stable API. Server-rendered web
content may fetch that API while interactive copies use SWR.

## Limitations

There is an extra HTTP boundary and contract to maintain. Local development
must coordinate two applications.
