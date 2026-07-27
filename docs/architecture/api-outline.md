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

`details.fields` is optional. Top-level and field codes are stable
machine-readable identifiers. User-facing prose is selected from the active
web dictionary and is not returned as an API contract. Raw driver errors,
exception messages, and stack traces are never returned.

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
- **Success:** `200` with `{ rooms: [{ id, name, floor, capacity }] }`
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private; catalogue may use controlled revalidation

### Weekly room schedule

- **Method/path:** `GET /api/rooms/:roomId/schedule`
- **Authentication:** required
- **Input:** query `{ weekStart }`, an unambiguous office-calendar date
- **Success:** `200` with room, UTC range, and active bookings containing
  `{ id, title, authorName, startsAt, endsAt, isOwned }`
- **Errors:** `UNAUTHENTICATED`, `VALIDATION_FAILED`, `ROOM_NOT_FOUND`
- **Cache:** private, dynamic/no-store; SWR manages interactive copies

## Bookings

### Create booking

- **Method/path:** `POST /api/bookings`
- **Authentication:** required
- **Input:** `{ roomId, title, startsAt, endsAt }` as ISO 8601 instants; no
  owner ID
- **Success:** `201` with confirmed booking
- **Errors:** `UNAUTHENTICATED`, `VALIDATION_FAILED`, `ROOM_NOT_FOUND`,
  `INVALID_BOOKING_INTERVAL`, `BOOKING_OUTSIDE_WORKING_HOURS`,
  `BOOKING_IN_PAST`, `BOOKING_CONFLICT`, `DATABASE_BUSY`
- **Cache:** mutation, `no-store`; revalidate schedule and personal lists

### Cancel booking

- **Method/path:** `DELETE /api/bookings/:bookingId`
- **Authentication:** required
- **Input:** booking ID path parameter
- **Success:** `204` after booking and slots update atomically
- **Errors:** `UNAUTHENTICATED`, `BOOKING_NOT_FOUND`,
  `BOOKING_CANCELLATION_FORBIDDEN`, `BOOKING_NOT_ACTIVE`, `DATABASE_BUSY`
- **Cache:** mutation, `no-store`; revalidate affected lists/schedule

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
