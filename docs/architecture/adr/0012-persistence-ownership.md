# ADR 0012: Persistence Ownership and Public APIs

- **Status:** Accepted

## Context

Auth and rooms already kept their Drizzle table declarations in infrastructure,
but booking schema declarations remained in `booking-data-access`. The auth
and rooms data-access barrels also re-exported infrastructure schemas, while
the booking barrel exposed schema and seed internals together with runtime
provider composition.

These aliases obscured ownership and would make future recurring-booking
schema additions expand the wrong public boundary.

## Decision

Each backend scope owns its persistence technology declarations in its
infrastructure project:

- `auth-infrastructure` owns users, sessions, and email-verification tables;
- `rooms-infrastructure` owns the room table;
- `booking-infrastructure` owns bookings and booking slots.

Data-access projects continue to own Drizzle repositories, readers, Nest
modules, and current seed orchestration. They consume schema tables through
the owning infrastructure `/schema` entry point. Auth and rooms
data-access do not re-export infrastructure symbols. Booking seed helpers
have an explicit `@mr-booking/booking-data-access/seed` entry point; the root
data-access barrel exports only runtime adapters and the API composition
module.

The infrastructure roots remain narrow. Their schema declarations are
available only through:

- `@mr-booking/auth-infrastructure/schema`;
- `@mr-booking/booking-infrastructure/schema`;
- `@mr-booking/rooms-infrastructure/schema`.

These entry points export persistence declarations and schema-derived row
types only. They do not expose repositories, Nest modules, seed services, or
delivery adapters.

The documented booking foreign-key exception remains intentional: booking
infrastructure references the authoritative auth and rooms infrastructure
schemas. No table, column, constraint, index, migration, or runtime contract
changes in this refactor.

## Consequences

Persistence ownership is visible in paths, aliases, Drizzle configuration, and
public imports. A future recurring schema belongs in
`booking-infrastructure`, while its repository/application behavior can be
added through the normal inward port and data-access boundaries. Narrow
barrels prevent consumers from obtaining schemas or seed internals through a
semantically incorrect compatibility alias.
