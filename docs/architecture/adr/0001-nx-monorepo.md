# ADR 0001: Nx Monorepo

- **Status:** Accepted

## Context

The project has separate Next.js and NestJS applications plus reusable
domain, feature, UI, and infrastructure concerns.

## Decision

Use one Nx monorepo. `apps/web` and `apps/api` are thin composition roots.
Real libraries are feature-first, tagged by scope/type/platform, and governed
by enforced module boundaries and public entry points.

## Alternatives considered

- Separate repositories: rejected because shared contracts and coordinated
  hackathon delivery would be harder.
- Unstructured single application: rejected because web/API boundaries would
  be weak.
- Precreating every possible library: rejected as speculative.

## Consequences

One tool orchestrates build, test, lint, and dependency checks. Project graph
rules make boundary violations visible.

## Limitations

Nx adds configuration and graph concepts. Libraries appear only with real
code, so the final project graph evolves during implementation.
