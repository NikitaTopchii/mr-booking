# ADR 0010: Backend Application Boundaries

- **Status:** Accepted

## Context

The backend CQRS libraries were named `auth/feature` and `booking/feature`,
but their responsibilities are application use cases: commands, queries,
handlers, authorization orchestration, and transaction coordination. Their
Nest modules also imported concrete data-access modules, which made the
application layer depend outward on infrastructure composition.

## Decision

Use `auth/application` and `booking/application` as API-side Nx libraries
tagged `type:application`. These libraries own commands, queries, handlers,
application contracts, and orchestration over inward-defined domain ports.

Application libraries MUST NOT import data-access, infrastructure, database,
or runtime configuration projects. Concrete adapter bindings and Nest CQRS
provider composition belong to the `apps/api` composition modules.

Data-access modules continue to implement and bind domain/application ports.
Persistence schema ownership is defined separately by ADR 0012: booking
infrastructure owns the booking tables and references the authoritative auth
and rooms infrastructure `/schema` entry points. Booking data-access may
still reference those explicit schema entry points for its read-model joins.

Frontend user-facing libraries remain `type:feature` and are unaffected by
this decision.

## Consequences

Backend application APIs are explicit and narrow. API composition has direct
visibility of both application handlers and concrete adapter modules, making
the dependency direction enforceable without introducing another composition
library or changing runtime behavior.

The application libraries remain Nx libraries (`projectType: "library"`),
while `type:application` identifies their architectural role.
