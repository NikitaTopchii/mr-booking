# ADR 0008: Opaque Database-Backed Sessions

- **Status:** Accepted

## Context

The application needs revocable authentication that survives reloads and
supports more than one browser per user. The deployment already has one
authoritative NestJS API and persistent SQLite storage.

## Decision

Use stateful opaque sessions. Generate 32 cryptographically random bytes,
encode them as base64url, and place the raw value only in an HttpOnly,
SameSite=Lax cookie. Persist a SHA-256 hash of the token in SQLite with the
user, creation instant, and fixed expiry instant.

Every protected request hashes the cookie value and looks up an unexpired
session. Current-user reads do not extend expiry. Registration and login issue
independent sessions, so multiple browsers remain valid. Logout deletes only
the current token hash and clears the cookie. Missing, unknown, and expired
tokens produce the same unauthenticated boundary.

## Alternatives considered

- JWT access/refresh tokens: rejected because immediate revocation still needs
  server state and adds key rotation and refresh-token complexity.
- Plain session tokens in SQLite: rejected because a database leak would
  expose live browser credentials.
- One session per user: rejected because logging in on one device should not
  silently invalidate another.

## Consequences

Revocation is immediate and session internals never cross the API. The
database unique constraint protects token hashes, while a user/expiry index
supports real lookup and maintenance patterns.

## Limitations

Each authenticated request performs a SQLite read. Expired rows are rejected
but are not yet removed by a scheduled cleanup job. Cookie confidentiality in
production relies on HTTPS so the `Secure` attribute is effective. Login
throttling is deferred hardening because the repository has no existing
throttling infrastructure.
