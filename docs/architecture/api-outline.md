# API Contract Outline

This outline freezes transport intent without generating controllers or DTOs.
All input is runtime-validated. Authentication uses a secure HttpOnly session
cookie.

## Error envelope

```json
{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "The room is already booked for this time.",
    "fieldErrors": {
      "startsAt": "Choose another time."
    }
  }
}
```

`fieldErrors` is optional. Codes are stable; messages are understandable but
not used as programmatic identifiers. Raw driver errors and stack traces are
never returned.

## Authentication

### Register

- **Method/path:** `POST /api/auth/register`
- **Authentication:** anonymous only
- **Input:** `{ name, email, password }`
- **Success:** `201` with `{ user: { id, name, email } }` and session cookie
- **Errors:** `VALIDATION_FAILED`, `EMAIL_ALREADY_EXISTS`
- **Cache:** private, `no-store`

### Login

- **Method/path:** `POST /api/auth/login`
- **Authentication:** anonymous
- **Input:** `{ email, password }`
- **Success:** `200` with `{ user: { id, name, email } }` and session cookie
- **Errors:** `VALIDATION_FAILED`, `INVALID_CREDENTIALS`
- **Cache:** private, `no-store`

### Logout

- **Method/path:** `POST /api/auth/logout`
- **Authentication:** required
- **Input:** none
- **Success:** `204`, session invalidated and cookie cleared
- **Errors:** `UNAUTHENTICATED`
- **Cache:** private, `no-store`

### Current session

- **Method/path:** `GET /api/auth/session`
- **Authentication:** cookie optional
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
