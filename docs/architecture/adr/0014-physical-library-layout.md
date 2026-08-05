# ADR 0014: Domain-first physical library layout

- **Status:** Accepted

## Context

Tags and graph auditing made runtime boundaries enforceable, but the previous
flat scope directories mixed server and web projects. A reviewer had to open
project configuration before seeing a project's runtime and responsibility.

## Decision

Keep business scope as the first directory below `libs/`. Domain libraries
remain at `<scope>/domain`; server libraries live below `<scope>/server`; web
libraries live below `<scope>/web`; and user-facing web features live below
`<scope>/web/features`. The grouping directories are not Nx projects.

`shared` groups ordinary projects by `agnostic`, `server`, and `web` runtime.
`shared/config` remains at its root because it intentionally combines an
agnostic root entrypoint with a protected server-only `/node` entrypoint.

Nx project names and public aliases remain stable when they already describe
their responsibility. This phase corrects only `auth-feature-web` to
`auth-feature-access` and `shared-feature-error` to `shared-error-handling`.
The architecture audit verifies that physical roots agree with project tags,
that grouping directories are not projects, and that project roots, source
roots, and package aliases remain unique.

## Consequences

The tree exposes scope, runtime, and role without changing dependency
direction or runtime behavior. The repository does not introduce top-level
`frontend` or `backend` roots, which would hide scope ownership. Future
projects must keep paths and tags aligned and may add a grouping only when a
real project requires it.
