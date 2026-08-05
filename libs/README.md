# Library layout

`libs/` is domain-first: `auth`, `booking`, and `rooms` are business scopes.
Their framework-neutral domain boundary remains at the scope root. Server code
lives under `server/`, web code under `web/`, and user-facing web workflows
under `web/features/`.

```text
libs/<scope>/
  domain/
  server/
    application/
    data-access/
    infrastructure/
  web/
    data-access/
    ui/
    features/
```

`shared` is grouped by runtime: `agnostic/`, `server/`, and `web/`.
`shared/config` is the intentional exception: its root is runtime-neutral,
while its protected `/node` entrypoint is server-only. It remains unsplit so
the exception is visible to reviewers.

`server`, `web`, `agnostic`, and `features` are filesystem groupings, not Nx
projects. Project tags enforce the same platform and layer rules; run
`yarn audit:boundaries` to validate both the graph and this layout. Import
between libraries through `@mr-booking/*` public aliases, never filesystem
paths or another library's internals.
