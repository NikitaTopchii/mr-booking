# Implementation Phase Plan

Each phase begins only when its prerequisites are met and ends only with its
acceptance gate. Actual code boundaries decide the final commit split.

## Phase 1: Workspace and runtime foundation

- **Prerequisites:** Phase 0 ADRs accepted; clean toolchain install.
- **Deliverables:** real `apps/web` and `apps/api`; strict project configs and
  Nx tags; module-boundary enforcement; only contracts needed by initial API;
  runtime environment validation; SQLite connection/PRAGMAs; first committed
  migration for mandatory models; deterministic rooms/users/demo seeds;
  Docker foundation.
- **Non-goals:** auth UI/use cases, schedule UI, booking features, bonus
  notification/PWA models, placeholder libraries.
- **Acceptance:** project graph is valid; apps start; migration and seed are
  repeatable; `.env.example` and startup documentation match real variables;
  root test/lint/typecheck/build/format commands execute real targets.
- **Tests:** configuration validation, migration/seed integration, API/web
  startup smoke, SQLite PRAGMA verification.
- **Expected commit boundary:** workspace/runtime, persistence migration, and
  seeds may be separate coherent commits.
- **Rollback risks:** generated defaults weakening strictness, premature
  libraries, incompatible framework versions, non-repeatable migrations.

## Phase 2: Authentication

- **Prerequisites:** API/web run; User and Session persistence exists; stable
  error envelope is available.
- **Deliverables:** registration, normalization, password hashing, login,
  logout, current session, reload persistence, server validation, forms and
  field errors.
- **Non-goals:** email verification bonus, roles, teams, social login.
- **Acceptance:** `AUTH-001` through `AUTH-010` pass; client-supplied identity
  is never trusted; secure cookie behavior is documented.
- **Tests:** normalization/password units, handler tests, unique-email/session
  integration, auth API tests, critical Playwright flow.
- **Expected commit boundary:** domain/persistence, session API, and web auth
  flow as reviewable milestones.
- **Rollback risks:** cookie/CORS mismatch, bcrypt truncation, enumeration via
  errors, session leakage in logs.

## Phase 3: Time and booking domain

- **Prerequisites:** clock/ID ports available; Room, Booking, and BookingSlot
  schema migrated.
- **Deliverables:** booking interval, half-open overlap, office-hours policy,
  centralized Kyiv/UTC conversion, server-clock validation, slot generation,
  atomic slot ownership and release.
- **Non-goals:** HTTP/UI flows, recurrence, notifications, outbox.
- **Acceptance:** all `BOOKING-*`, `TIME-*`, and interval test rules are
  represented by independently testable policies; two concurrent contenders
  leave one active winner when bonus race evidence is pursued.
- **Tests:** complete interval matrix, duration/alignment, DST/zone boundaries,
  file-backed SQLite transactions and contention.
- **Expected commit boundary:** time policies, interval policies, persistence
  adapter/race protection.
- **Rollback risks:** ambiguous local parsing, DST errors, inclusive-end
  overlap, in-memory tests masking SQLite locking.

## Phase 4: Rooms and schedule API

- **Prerequisites:** deterministic rooms; booking domain/persistence; auth
  guard and error mapper.
- **Deliverables:** room list query, weekly room schedule query, stable UTC
  contracts, author and `isOwned` projection.
- **Non-goals:** capacity filter bonus, calendar rendering, live push.
- **Acceptance:** seeded rooms are queryable; a selected room/week returns
  active bookings only in deterministic order; private/dynamic cache policy is
  explicit.
- **Tests:** query handlers, room-not-found/week validation, API integration,
  timezone-range cases.
- **Expected commit boundary:** room catalogue query and weekly schedule query.
- **Rollback risks:** leaking owner data, week-boundary timezone errors,
  inefficient unindexed range query.

## Phase 5: Schedule UI

- **Prerequisites:** room/schedule API stable; design recommendations reviewed
  against `docs/ui/design-brief.md`.
- **Deliverables:** room selector, custom weekly grid, previous/next week,
  current day/time, owned/foreign distinction, browser/office timezone
  display, loading/empty/error states, SWR keys and revalidation.
- **Non-goals:** ready-made scheduler, authoritative validation, booking
  mutation, final polish.
- **Acceptance:** `SCHEDULE-001` through `SCHEDULE-014` and relevant `UI-*`
  rows pass at phone and desktop baselines.
- **Tests:** grid positioning units, accessible component tests, time-controlled
  current marker, Playwright room/week navigation.
- **Expected commit boundary:** schedule query client, grid calculation, grid
  presentation/navigation.
- **Rollback risks:** oversized Client Components, hover-only interaction,
  unreadable mobile scaling, duplicated timezone logic.

## Phase 6: Create and cancel booking

- **Prerequisites:** schedule UI/API; booking commands and ownership policy.
- **Deliverables:** creation form/mutation, server error mapping, conflict
  recovery, confirmed schedule refresh, owner cancellation, foreign
  rejection, confirmation or undo behavior.
- **Non-goals:** optimistic success, recurring bookings, notifications.
- **Acceptance:** `BOOKING-001` through `BOOKING-009` and
  `CANCELLATION-001` through `CANCELLATION-004` pass through UI and direct API.
- **Tests:** handler/API authorization and validation, conflict integration,
  cancellation slot release, Playwright create/conflict/cancel.
- **Expected commit boundary:** create command/API, create UI, cancellation
  command/API, cancellation UI.
- **Rollback risks:** client-authoritative ownership, stale SWR cache,
  duplicate submissions, slot rows surviving cancellation.

## Phase 7: My bookings

- **Prerequisites:** authenticated booking queries and stable schedule URLs.
- **Deliverables:** upcoming list, cursor-paginated past list, local-time
  display, navigation to room/week.
- **Non-goals:** cancelled-history management, export, search.
- **Acceptance:** `MY-BOOKINGS-001` through `MY-BOOKINGS-006` pass with empty,
  loading, pagination-error, and success states.
- **Tests:** ordering/cursor handlers, private API integration, component and
  Playwright navigation/loading-more flows.
- **Expected commit boundary:** personal queries/API and web lists/navigation.
- **Rollback risks:** unstable pagination, duplicate rows, wrong time
  partition at the server clock.

## Phase 8: Responsive UI and polish

- **Prerequisites:** all mandatory flows function end-to-end.
- **Deliverables:** complete responsive pass, keyboard/focus review,
  accessibility fixes, token consistency, reduced motion, final empty/error
  coverage, demo performance.
- **Non-goals:** changing domain behavior or adding lower-priority bonuses.
- **Acceptance:** mandatory matrix is green; critical flows work at small
  phone, tablet, and desktop sizes; no hover-only essential action.
- **Tests:** accessibility scans/manual keyboard review, responsive Playwright
  scenarios, reduced-motion and timezone-difference checks.
- **Expected commit boundary:** focused accessibility, responsive, and state
  coverage commits rather than one catch-all.
- **Rollback risks:** visual refactors breaking flows, snapshots replacing
  behavioral tests, late design-system churn.

## Phase 9: High-value bonuses

- **Prerequisites:** all mandatory acceptance rows pass and delivery docs are
  current.
- **Deliverables:** select bonuses in priority order: expanded API integration
  tests, capacity filter, development email verification, in-app
  notifications, recurrence, then PWA/Web Push. Complete Docker/race evidence
  where foundation exists.
- **Non-goals:** implementing every bonus or allowing PWA/push to delay
  mandatory quality.
- **Acceptance:** each selected `BONUS-*` row has independent evidence and no
  mandatory regression.
- **Tests:** bonus-specific integration/E2E; notification timing/exactly-once;
  recurrence validation; PWA offline mutation rejection.
- **Expected commit boundary:** one coherent milestone per selected bonus.
- **Rollback risks:** schema expansion, background delivery complexity,
  browser permissions, HTTPS requirements, distracting from demo readiness.
