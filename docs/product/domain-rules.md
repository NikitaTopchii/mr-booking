# Product Domain Rules

These rules describe behavior without prescribing frameworks or persistence
libraries. The server is authoritative for identity, time, validation, and
ownership.

## Identity and authentication

### Email normalization

1. Accept an email string from validated transport input.
2. Trim leading and trailing whitespace.
3. Convert it to lowercase using locale-independent casing.
4. Validate the normalized value as an email.
5. Compare and uniquely constrain the normalized value.

`Ivan@x.com`, `ivan@x.com`, and `  IVAN@x.com  ` therefore identify the same
account. The original presentation value MAY be retained separately, but it
MUST NOT control identity or uniqueness.

### Names

Names are trimmed at both ends and must remain non-empty. Unicode names are
accepted without an invented format or uniqueness rule.

### Passwords

- Password length is 8–72 Unicode code points.
- Passwords are not trimmed or case-normalized.
- The accepted value is hashed with Argon2 or bcrypt and is never stored or
  logged in plaintext.
- The selected hasher MUST preserve the full accepted range without silent
  truncation.

### Sessions

- Registration automatically creates a session.
- A session token contains at least 256 bits of cryptographic entropy.
- Only its SHA-256 hash is persisted; the raw value exists only in the
  HttpOnly browser cookie and the issuing transport boundary.
- Sessions expire after the configured lifetime and are never extended by a
  current-user read.
- One user may have multiple sessions. Logout deletes only the session
  represented by the current cookie and remains idempotent if it is absent.
- Missing, unknown, and expired sessions are all unauthenticated.
- Authentication responses are private and non-cacheable. Success and error
  bodies are runtime-validated at each web boundary; malformed or unexpected
  payloads never become trusted user or field-error state.

### Authenticated ownership

The authenticated user ID comes only from the server session. Booking owner
IDs, roles, and permissions supplied by a client are ignored. A user owns a
booking only when the persisted `booking.userId` equals the authenticated
session user ID.

## Rooms and office policy

- Every room has a stable ID, name, floor, and positive capacity.
- All rooms share office timezone `Europe/Kyiv`.
- All rooms share working hours `09:00` inclusive through `19:00` exclusive.
- The specification does not define closed weekdays. Until clarified, the
  same hours apply to every bookable calendar date.

## Timezones and persistence

- The server converts proposed local office times through `Europe/Kyiv`.
- Absolute instants are persisted in UTC.
- Phase 3B booking API timestamps use ISO 8601 absolute datetime strings.
  Inputs require `Z` or an explicit offset; responses use canonical UTC with
  milliseconds and `Z`.
- The browser timezone controls display only.
- When browser and office zones differ, the UI identifies the office zone.
- Locale-formatted strings and ambiguous date strings are never authoritative.

## Booking interval

A booking interval is half-open: `[start, end)`.

It is valid only when:

- title length is 1–100 characters after trimming;
- start and end are valid absolute instants;
- `start < end`;
- both boundaries align to 30-minute office-time boundaries;
- duration is at least 30 minutes and at most 4 hours;
- the whole interval is inside one office day from 09:00 through 19:00;
- start is strictly later than the authoritative server clock;
- no active booking for the same room overlaps it.

Two intervals overlap exactly when:

```text
existing.start < candidate.end
and
candidate.start < existing.end
```

Examples:

| Existing           | Candidate          | Result   | Reason                               |
| ------------------ | ------------------ | -------- | ------------------------------------ |
| 10:00–11:00        | 11:00–12:00        | Allowed  | Half-open intervals are adjacent     |
| 10:00–11:00        | 10:30–11:30        | Conflict | Partial overlap                      |
| 10:00–12:00        | 10:30–11:00        | Conflict | Existing interval contains candidate |
| 10:00–11:00        | 10:00–11:00        | Conflict | Identical interval                   |
| Room A 10:00–11:00 | Room B 10:00–11:00 | Allowed  | Ownership is scoped by room          |
| 18:30–19:00        | —                  | Allowed  | End equals closing boundary          |
| 18:30–19:30        | —                  | Rejected | Interval crosses closing time        |

The server returns a stable, understandable error for every failed rule.

## Cancellation

- Only the authenticated owner may cancel an active booking.
- UI visibility does not replace server authorization.
- A booking that has started or is in the past cannot be newly cancelled.
- Repeating cancellation as the owner is idempotent, including after the
  original start instant; the original cancellation timestamp is preserved.
- Cancellation makes the booking inactive and releases all owned slots in one
  transaction.

## Personal booking queries

- Upcoming contains active bookings whose `end > serverNow`, including an
  ongoing booking, ordered by `start ASC`, then stable ID.
- Past contains active bookings whose `end <= serverNow`, ordered by
  `start DESC`, then stable ID descending.
- Cancelled bookings are excluded from mandatory upcoming and past lists.
- Past results use cursor pagination based on the ordering tuple rather than
  unstable page offsets.
- Dates and times are returned as UTC instants and displayed in the browser
  timezone.
