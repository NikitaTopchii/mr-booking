# ADR 0003: SQLite with Drizzle

- **Status:** Accepted

## Context

The hackathon needs simple local persistence with committed schema evolution
and strong constraints.

## Decision

Use SQLite through Drizzle ORM and `better-sqlite3`, with Drizzle Kit
migrations. Enable WAL, foreign keys, and a 5000 ms busy timeout. Run one API
writer and keep the database/WAL/SHM files on one persistent volume.

## Alternatives considered

- PostgreSQL: capable but adds operational weight outside the requirement.
- Prisma or TypeORM: rejected because Drizzle is the selected ORM.
- In-memory-only storage: rejected because persistence and concurrency must be
  demonstrable.

## Consequences

Deployment and local setup remain small. Constraints and transactions enforce
critical invariants close to data.

## Limitations

SQLite has one-writer contention and does not support horizontal API scaling
for this design. Busy errors require stable handling; concurrency tests use
temporary file-backed databases.
