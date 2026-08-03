# API Contract Outline

This outline freezes transport intent without generating controllers or DTOs.
All input is runtime-validated. Authentication uses a secure HttpOnly session
cookie.

## Error envelope

```json
{
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": {
      "email": "EMAIL_INVALID"
    }
  }
}
```

`details.fields` is omitted for errors without a field contract and required
for authentication validation or duplicate-email errors. Top-level and field
codes are stable machine-readable identifiers. User-facing prose is selected
from the active web dictionary and is not returned as an API contract. Raw
driver errors, exception messages, and stack traces are never returned.

Web clients runtime-validate the complete response shape. Authentication
success bodies reject extra fields, while validation and duplicate-email
errors require their documented field details. Malformed JSON, unknown codes,
unexpected fields, and incomplete error envelopes map to a safe localized
`SERVICE_UNAVAILABLE` state.

Authentication field codes are `NAME_REQUIRED`, `EMAIL_REQUIRED`,
`EMAIL_INVALID`, `PASSWORD_REQUIRED`, `PASSWORD_LENGTH`, and
`EMAIL_ALREADY_EXISTS`.

## Authentication

### Register

- **Method/path:** `POST /api/auth/register`
- **Authentication:** anonymous only
- **Input:** `{ name, email, password, locale? }`
- **Success:** `201` with a safe user containing `emailVerified: false`, an
  optional safe verification delivery status, and session cookie
- **Errors:** `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`,
  `SERVICE_UNAVAILABLE`
- **Cache:** private, `no-store`

### Login

- **Method/path:** `POST /api/auth/login`
- **Authentication:** anonymous
- **Input:** `{ email, password }`
- **Success:** `200` with `{ user: { id, name, email, emailVerified } }` and
  session cookie
- **Errors:** `VALIDATION_ERROR`, `INVALID_CREDENTIALS`,
  `SERVICE_UNAVAILABLE`
- **Cache:** private, `no-store`

### Request email verification

- **Method/path:** `POST /api/auth/email-verification/request`
- **Authentication:** required session; identity is server-derived
- **Input:** `{ locale?: "uk" | "en" }`
- **Success:** `200` with `sent` or `already-verified`, canonical UTC expiry,
  retry-after seconds, and a development URL only when both development
  delivery and explicit link exposure are configured
- **Errors:** `UNAUTHENTICATED`, `EMAIL_VERIFICATION_RATE_LIMITED`,
  `EMAIL_VERIFICATION_DELIVERY_FAILED`, `SERVICE_UNAVAILABLE`

### Verify email

- **Method/path:** `POST /api/auth/email-verification/verify`
- **Authentication:** public
- **Input:** `{ token }`; the token is consumed only after explicit user
  confirmation in the localized verification page
- **Success:** `200` with `EMAIL_VERIFIED` or `EMAIL_ALREADY_VERIFIED`
- **Errors:** invalid, expired, superseded, and replayed tokens all return
  the same `EMAIL_VERIFICATION_INVALID_OR_EXPIRED` result
- **Cache:** mutation, `no-store`

### Logout

- **Method/path:** `POST /api/auth/logout`
- **Authentication:** cookie optional
- **Input:** none
- **Success:** `204`, session invalidated and cookie cleared
- **Errors:** `SERVICE_UNAVAILABLE`; a missing session is still a successful
  idempotent logout
- **Cache:** private, `no-store`

### Current user

- **Method/path:** `GET /api/auth/me`
- **Authentication:** required session cookie
- **Input:** none
- **Success:** `200` with `{ user }`; anonymous uses `401`
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private, `no-store`

## Rooms and schedule

### List rooms

- **Method/path:** `GET /api/rooms`
- **Authentication:** required
- **Input:** none
- **Success:** `200` with
  `{ rooms: [{ id, name, floor, capacity }] }`, ordered by floor and then name
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private, `no-store`

### Room schedule range

- **Method/path:** `GET /api/rooms/:roomId/bookings`
- **Authentication:** required
- **Input:** query `{ fromUtc, toUtc }` as ISO 8601 absolute datetime strings
  with `Z` or an explicit offset and `fromUtc < toUtc`
- **Success:** `200` with
  `{ bookings: [{ id, roomId, title, startsAtUtc, endsAtUtc, author: { id, name }, isMine }] }`
- **Errors:** `UNAUTHENTICATED`, `VALIDATION_ERROR`, `ROOM_NOT_FOUND`
- **Cache:** private, dynamic/no-store; SWR manages interactive copies

The requested range is an absolute half-open interval `[fromUtc, toUtc)`.
The HTTP boundary rejects datetimes without timezone information and parses
valid absolute datetime strings immediately to internal UTC epoch
milliseconds. Explicit `+` offsets must be URL-encoded in query strings.
The browser chooses the absolute instants for its browser-local visible
week; NestJS does not reinterpret this query in `Europe/Kyiv`. Active
bookings overlap the range when
`booking.startsAtUtc < toUtc && fromUtc < booking.endsAtUtc`, so bookings
crossing either visible boundary are included. Cancelled bookings and
internal booking-slot rows are excluded. Results order by start, end, and
stable booking ID. The server joins only the author's public ID/name and
derives `isMine` from the authenticated session. Response timestamps are
canonical UTC ISO 8601 strings with milliseconds and `Z`.

## Bookings

### Create booking

- **Method/path:** `POST /api/bookings`
- **Authentication:** required
- **Input:** `{ roomId, title, startsAtUtc, endsAtUtc }`; timestamps are ISO
  8601 absolute datetime strings with `Z` or an explicit offset, and
  identity/ownership fields are forbidden
- **Success:** `201` with
  `{ booking: { id, roomId, title, startsAtUtc, endsAtUtc, author: { id, name }, isMine: true } }`
- **Errors:** `UNAUTHENTICATED`, `BOOKING_TITLE_REQUIRED`,
  `BOOKING_TITLE_TOO_LONG`, `BOOKING_START_NOT_IN_FUTURE`,
  `BOOKING_INVALID_INTERVAL`, `BOOKING_INVALID_DURATION`,
  `BOOKING_SLOT_ALIGNMENT`, `BOOKING_OUTSIDE_OFFICE_HOURS`,
  `ROOM_NOT_FOUND`, `BOOKING_CONFLICT`, `DATABASE_BUSY`
  `EMAIL_VERIFICATION_REQUIRED`
- **Cache:** mutation, `no-store`; revalidate schedule and personal lists

### Cancel booking

- **Method/path:** `DELETE /api/bookings/:bookingId`
- **Authentication:** required
- **Input:** booking ID path parameter
- **Success:** `204` after booking and slots update atomically; repeating an
  owner cancellation is an idempotent `204`
- **Errors:** `UNAUTHENTICATED`, `BOOKING_NOT_FOUND`,
  `BOOKING_CANCELLATION_FORBIDDEN`, `BOOKING_NOT_CANCELLABLE`,
  `DATABASE_BUSY`
- **Cache:** mutation, `no-store`; revalidate affected lists/schedule

The transport mapper uses `400` for booking validation codes, `403` for
`BOOKING_CANCELLATION_FORBIDDEN`, `404` for missing rooms/bookings, `409` for
`BOOKING_CONFLICT` and `BOOKING_NOT_CANCELLABLE`, and `503` for
`DATABASE_BUSY`. Malformed transport input uses `400 VALIDATION_ERROR`.
Phase 3B implements these authenticated endpoints and their stable mapper.
Booking validity remains authoritative in the existing domain and evaluates
office hours in `Europe/Kyiv`. Successful booking responses normalize
timestamps to canonical UTC ISO 8601 strings with milliseconds and `Z`.

## Personal bookings

### Upcoming bookings

- **Method/path:** `GET /api/bookings/mine/upcoming`
- **Authentication:** required
- **Input:** none
- **Success:** `200` with
  `{ items: [{ id, title, startsAtUtc, endsAtUtc, room: { id, name, floor, capacity }, status, canCancel }], serverNowUtc }`
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private, `no-store`

Items are active, owned, and satisfy `endsAtUtc > serverNowUtc`. They order by
`startsAtUtc ASC, id ASC`. `UPCOMING` items start after the authoritative
clock and have `canCancel: true`; already-started active items are
`IN_PROGRESS` and cannot be cancelled. All timestamps are canonical UTC ISO
8601 strings with milliseconds and `Z`.

### Past bookings

- **Method/path:** `GET /api/bookings/mine/past`
- **Authentication:** required
- **Input:** query `{ cursor?, limit? }`; `limit` defaults to 20 and is bounded
  from 1 through 50
- **Success:** `200` with
  `{ items: [{ id, title, startsAtUtc, endsAtUtc, room, status: "PAST", canCancel: false }], serverNowUtc, nextCursor }`
- **Errors:** `VALIDATION_ERROR`, `UNAUTHENTICATED`
- **Cache:** private, `no-store`

Past items are active, owned, and satisfy `endsAtUtc <= serverNowUtc`. They
order by `startsAtUtc DESC, id DESC`. The opaque cursor carries the stable
ordering tuple and carries a process-keyed HMAC signature; malformed or
tampered cursors and invalid limits return `400 VALIDATION_ERROR`. The query
requests `limit + 1` rows to decide whether another page exists. Cursors are
intentionally invalidated by an API process restart. Cancelled and foreign
bookings never appear.
