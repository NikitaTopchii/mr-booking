# Testing and Quality Rules

Use:

- unit tests for domain policies, intervals, and time logic;
- handler tests for application use cases;
- integration tests for SQLite, migrations, and transactions;
- API integration tests for transport, authorization, and stable errors;
- Playwright for critical user flows.

Interval tests MUST cover adjacent, partial overlap, full overlap,
containment, identical intervals, the same time in different rooms,
neighboring days, and cancellation releasing time.

A race test MUST have two concurrent users reserve the same room and interval:
exactly one succeeds and exactly one active booking remains. Use a temporary
file-backed SQLite database for real locking and multiple connections.

Authorization tests MUST prove that the owner can cancel, another user
receives forbidden, and a direct API request cannot bypass ownership.
Timezone and DST policies require dedicated tests. When notification features
exist, test timing, exactly-once delivery, cancellation suppression, and
configuration boundaries.

Tests MUST NOT assert only implementation details, disable meaningful cases,
use large unstable snapshots, alter production behavior solely to pass, use
`.only`, or silently skip critical scenarios.

## Quality gates

`npm test` MUST run the real mandatory suite. Separately configured
integration and E2E suites MUST use `test:integration` and `test:e2e`.

Before completion, run relevant focused checks and:

```text
yarn verify:commit
```

Verification runs all configured tests, lint, typecheck, production build, and
Prettier check in that order. It MUST be fail-fast, non-watch, non-mutating,
and MUST NOT hide or skip failures. Prettier check is last.

A feature is done only when behavior matches the specification,
authorization/server validation are enforced, loading/empty/error states and
mobile/accessibility behavior are handled, tests and documentation are
current, and every applicable gate passes. Report limitations and risks.

## History

Use coherent milestone commits. Do not combine unrelated work or create one
giant final commit. Subjects such as `wip`, `update`, `fix stuff`, and
`changes` are prohibited. Do not amend public commits or rewrite shared
history without explicit approval.

## Required documentation

README MUST document clean installation, local and Docker startup, migrations,
seed execution, test-user credentials, `npm test`, all verification commands,
implemented bonuses, booking overlap/race protection, UTC storage,
browser/office timezone conversion, and known limitations.
