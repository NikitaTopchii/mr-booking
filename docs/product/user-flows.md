# Primary User Flows

Every flow treats the NestJS API as authoritative. The UI never confirms a
mutation before the server succeeds.

## 1. Registration

- **Starting state:** anonymous user on registration.
- **Actions:** enter name, email, password; submit.
- **Loading:** disable submit and preserve entered values.
- **Success:** create account/session and navigate to room schedule.
- **Errors:** field validation, duplicate normalized email, server failure.
- **Server checks:** name, email normalization/uniqueness, password length,
  password hashing.
- **Navigation:** schedule or intended protected destination.

## 2. Login

- **Starting state:** anonymous user on login.
- **Actions:** enter email/password; submit.
- **Loading:** disable submit and show progress.
- **Success:** issue secure session and load authenticated destination.
- **Errors:** invalid fields, invalid credentials, server unavailable.
- **Server checks:** normalized email, password verification, session issue.
- **Navigation:** schedule or original protected destination.

## 3. Session restoration

- **Starting state:** page reload with or without a valid session cookie.
- **Actions:** browser requests current session.
- **Loading:** stable authentication loading boundary.
- **Success:** restore user without another login.
- **Errors:** expired/invalid session becomes anonymous; infrastructure error
  offers retry.
- **Server checks:** session validity and user existence.
- **Navigation:** remain on protected page when valid; otherwise login.

## 4. Logout

- **Starting state:** authenticated user in the application shell.
- **Actions:** activate the logout control once.
- **Loading:** disable repeated logout while the request is active.
- **Success:** delete only the current server session, clear the cookie, and
  navigate to login.
- **Errors:** retain the current screen and offer a clear retry message.
- **Server checks:** hash the current raw cookie token and delete its matching
  session idempotently.

## 5. Room selection

- **Starting state:** authenticated schedule with rooms loading.
- **Actions:** choose one room.
- **Loading:** room list and selected-room schedule load independently.
- **Success:** selected room and its current week are visible.
- **Errors:** room-list failure, schedule failure, no seeded rooms.
- **Server checks:** room existence and schedule query bounds.
- **Navigation:** URL/state identifies selected room and week.

## 6. Weekly schedule navigation

- **Starting state:** one room/week displayed.
- **Actions:** move to previous or next week.
- **Loading:** keep context while the new schedule revalidates.
- **Success:** grid updates with current day/time when applicable.
- **Errors:** query/connection error with retry; empty week remains usable.
- **Server checks:** room existence and normalized week range.
- **Navigation:** URL represents room and week for deep linking.

## 7. Booking creation

- **Starting state:** authenticated user, selected room/week, creation control.
- **Actions:** enter title/date/start/end; submit.
- **Loading:** disable duplicate submit; do not show optimistic success.
- **Success:** close/reset form and revalidate schedule/personal bookings.
- **Errors:** invalid title/interval, past time, outside hours, conflict,
  server contention.
- **Server checks:** identity, room, interval, server clock, office zone,
  overlap, transactional slot ownership.
- **Navigation:** remain on selected room/week and reveal confirmed booking.

## 8. Booking conflict

- **Starting state:** creation form proposes an occupied interval.
- **Actions:** submit.
- **Loading:** normal server-confirmed mutation state.
- **Success:** none for the rejected request.
- **Errors:** stable conflict code with a clear explanation and retained input.
- **Server checks:** unique room/slot ownership in the write transaction.
- **Navigation:** remain in context; revalidate schedule to show the winner.

## 9. Owned-booking cancellation

- **Starting state:** user selects their active booking.
- **Actions:** choose cancel and confirm, or use the specified undo pattern.
- **Loading:** disable repeated cancellation.
- **Success:** remove/relabel booking and revalidate affected queries.
- **Errors:** not found, already inactive, server failure.
- **Server checks:** authenticated ownership and transactional slot release.
- **Navigation:** remain on schedule or personal list.

## 10. Attempted foreign cancellation

- **Starting state:** user views another user's booking.
- **Actions:** UI offers no cancellation action; direct API may still be
  attempted.
- **Loading:** only applies to a malicious/direct request.
- **Success:** cancellation never succeeds.
- **Errors:** stable forbidden response without leaking sensitive detail.
- **Server checks:** booking owner equals authenticated user.
- **Navigation:** remain in place; booking stays active.

## 11. Upcoming personal bookings

- **Starting state:** authenticated user opens personal bookings.
- **Actions:** view or select an upcoming item.
- **Loading:** list skeleton/progress.
- **Success:** active non-past items ordered nearest first.
- **Errors:** query error with retry; empty state when none exist.
- **Server checks:** authenticated user scope and server-time partition.
- **Navigation:** selected item opens matching room/week.

## 12. Past-booking navigation

- **Starting state:** personal bookings with past section.
- **Actions:** load more and select an item.
- **Loading:** incremental control prevents duplicate requests.
- **Success:** newest-first results append without duplicates.
- **Errors:** pagination error preserves already loaded rows.
- **Server checks:** authenticated scope, stable cursor, past-time partition.
- **Navigation:** selected item opens matching room/week.

## 13. Mobile schedule usage

- **Starting state:** authenticated user on a phone-width viewport.
- **Actions:** select room, navigate week/day, inspect booking, start creation.
- **Loading:** compact states preserve room/week context.
- **Success:** core schedule and booking behavior works without hover or a
  shrunken desktop-only grid.
- **Errors:** readable inline/retry states; offline remains non-mutating.
- **Server checks:** identical to desktop; viewport never changes authority.
- **Navigation:** controls and deep links remain keyboard/touch accessible.
