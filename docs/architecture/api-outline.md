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
- **Input:** `{ name, email, password }`
- **Success:** `201` with `{ user: { id, name, email } }` and session cookie
- **Errors:** `VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`,
  `SERVICE_UNAVAILABLE`
- **Cache:** private, `no-store`

### Login

- **Method/path:** `POST /api/auth/login`
- **Authentication:** anonymous
- **Input:** `{ email, password }`
- **Success:** `200` with `{ user: { id, name, email } }` and session cookie
- **Errors:** `VALIDATION_ERROR`, `INVALID_CREDENTIALS`,
  `SERVICE_UNAVAILABLE`
- **Cache:** private, `no-store`

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

- **Method/path:** `GET /api/me/bookings/upcoming`
- **Authentication:** required
- **Input:** none
- **Success:** `200` with active bookings ordered by start ascending
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private, `no-store`

### Past bookings

- **Method/path:** `GET /api/me/bookings/past`
- **Authentication:** required
- **Input:** query `{ cursor?, limit? }` with bounded limit
- **Success:** `200` with `{ items, nextCursor }`, newest first
- **Errors:** `VALIDATION_FAILED`, `UNAUTHENTICATED`
- **Cache:** private, `no-store`
