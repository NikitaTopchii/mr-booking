# System Overview

Status: **Frozen for implementation**

This document defines the minimum architecture for mandatory delivery. It does
not prescribe placeholder libraries or future bonus modules.

## Technology baseline

- Nx monorepo;
- Next.js App Router web application;
- NestJS API;
- SQLite with Drizzle ORM, `better-sqlite3`, and Drizzle Kit migrations;
- CQRS without event sourcing;
- shadcn/ui, Radix primitives, Tailwind CSS, Lucide, and Sonner;
- SWR for volatile interactive server state;
- repository-owned custom weekly calendar grid;
- Docker Compose runtime foundation.

Do not add microservices, GraphQL, Redux, event sourcing, another ORM/database,
another complete UI system, or a ready-made scheduler.

## Runtime shape

```text
Browser
  -> Next.js web
      -> NestJS HTTP API
          -> application commands / queries
              -> domain policies and ports
                  -> Drizzle + better-sqlite3
                      -> SQLite file
```

The hackathon deployment uses one API process as the only SQLite writer. Web
and API should preferably share one public origin. The frontend never mounts
or opens the database volume.

Phase 3A realizes the booking write side as three Nx boundaries:

```text
booking-feature -> booking-domain <- booking-data-access
                                  -> SQLite bookings + booking_slots
```

`rooms-domain` exposes only the room-existence port. Feature-owned
`auth-infrastructure` and `rooms-infrastructure` expose Drizzle table
declarations so booking foreign keys do not require data-access-to-data-access
dependencies. Existing auth and room data-access barrels preserve their public
schema exports.

## Responsibility boundaries

### Next.js

Owns:

- App Router routing, layouts, and route boundaries;
- server-rendered initial UI where practical;
- small Client Component interaction boundaries;
- SWR cache, mutation revalidation, and feature-owned keys;
- local presentation state such as dialogs, selected dates, and draft values;
- browser-timezone formatting and office-timezone notice;
- accessible loading, empty, error, disabled, and permission states.

Does not own authentication truth, authorization, booking validation,
transactions, overlap decisions, or persistence.

### NestJS

Owns:

- registration, login, logout, and session resolution;
- authenticated identity and booking ownership;
- runtime input validation;
- commands, queries, handlers, and stable domain-error mapping;
- office-time, interval, overlap, and cancellation rules;
- application transaction boundaries;
- persistence orchestration and API contracts.

Controllers remain transport adapters and do not contain business rules.

### SQLite

Owns durable state and enforceable invariants:

- users, sessions, rooms, bookings, and booking slots;
- foreign keys, unique constraints, checks, and indexes;
- unique `(room_id, slot_starts_at_utc)` ownership;
- atomic booking/slot creation and cancellation slot release.

WAL, foreign keys, and a 5000 ms busy timeout are enabled and verified.

## Request and state flow

- Initial route data MAY be server-rendered through the API.
- Localized routes use explicit `uk` or `en` URL segments. Typed dictionaries
  are dynamically loaded in Server Components and only selected serializable
  messages cross a Client Component boundary.
- The protected locale layout resolves the safe authenticated user once and
  owns the reusable application shell. It composes product identity, primary
  navigation, the read-only user menu, locale switching, and the existing
  logout feature without repeating current-user requests in nested pages.
- Schedule and My bookings remain Server Component destinations. Small client
  boundaries own only pathname-aware active navigation, the Radix user menu,
  and logout interaction.
- Interactive schedule, availability, and personal lists use SWR.
- Mutations remain pending until the API confirms success.
- The API uses the server clock and returns canonical UTC ISO 8601 timestamps.
- The UI formats instants in the browser timezone.
- A stable error envelope maps machine-readable application/domain and field
  codes to localized UI states without translating backend prose.

## Bonus boundary

The mandatory data model has no recurring series, notification, outbox, or
push-subscription tables. Those are added only when their bonus is selected
after mandatory acceptance. Docker and slot-race capabilities may be prepared
early by the required foundation, but bonus status is earned only when the
corresponding acceptance row is implemented and evidenced.
