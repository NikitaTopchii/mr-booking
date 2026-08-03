# ADR 0009: Email verification as an authenticated, server-authoritative flow

## Status

Accepted and implemented.

## Context

New accounts need proof of email ownership without making registration or
read-only scheduling unusable. Verification must survive restarts, resist
replay and concurrent consumption, and avoid introducing a mail provider
before one is selected.

## Decision

Users store a nullable `email_verified_at_utc`; safe user DTOs derive only
`emailVerified`. A 32-byte base64url token is hashed with SHA-256 before it is
stored in `email_verification_tokens`. Issuance, cooldown, supersession, and
consumption use application-owned SQLite immediate transactions and an
injected clock. Consumption updates the user and token records atomically.

Registration persists the account and session before attempting initial
delivery. Delivery failure returns a safe retry state and never rolls back the
account. Resend is authenticated and session-derived; verification is a
public POST after explicit page confirmation. Invalid, expired, superseded,
and replayed tokens share one public error.

The only delivery adapter currently enabled is an explicitly configured
development adapter. It renders localized, escaped templates and can expose
a link only when `EMAIL_DELIVERY_MODE=development` and
`EXPOSE_DEVELOPMENT_VERIFICATION_LINK=true`. Production uses the disabled
adapter until a provider is approved; production responses never contain raw
tokens or links.

Booking creation depends on a narrow verification-status port and returns
`EMAIL_VERIFICATION_REQUIRED` for unverified users. Reads and cancellation of
an existing owned future booking remain available. Current-user SWR is
refreshed after success so no relogin is needed.

## Consequences

- Migrated users are deterministically verified from `created_at_utc`; new
  registrations are unverified.
- Token rows contain no recoverable raw credential, and URL tokens disappear
  from the visible verification route after confirmation.
- A real provider and production delivery configuration remain intentionally
  deferred rather than being implied by the development adapter.
