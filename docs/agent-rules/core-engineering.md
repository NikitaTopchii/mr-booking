# Core Engineering Rules

These rules apply to all implementation and refactoring work.

## Principles

Code MUST follow SOLID, DRY, KISS, YAGNI, composition over inheritance,
explicit dependencies, explicit domain language, and no hidden side effects.
TypeScript MUST remain strict. Code MUST have one clear responsibility and
make state changes visible at the call site.

SOLID does not require interfaces or classes everywhere. Add an abstraction
only when it protects a real boundary, represents a domain concept, removes
meaningful duplication, makes behavior independently testable, or supports a
known variation point.

Prefer small cohesive methods, early guard clauses, and explicit return
values. Keep business decisions out of generic infrastructure utilities.
Refactor only what the requested change requires; do not combine feature work
with unrelated cleanup.

## Type safety and naming

Type declarations MUST follow `docs/agent-rules/type-placement.md`.
Implementation files do not own structural interfaces or type aliases; place
them at the narrowest type-focused ownership boundary.

Code MUST NOT contain:

- `any` without a documented unavoidable reason;
- `@ts-ignore`;
- unsafe non-null assertions;
- unvalidated external data;
- generic names such as `Manager`, `Processor`, `Helper`, `Data`, or
  `CommonService`;
- magic business values;
- boolean-parameter calls such as `create(true, false)`.

Use names from the domain, such as `BookingInterval`, `RoomAvailability`,
`BookingConflict`, `WorkingHoursPolicy`, `SlotBoundaryPolicy`, and
`BookingCancellationPolicy`. Make units and timezone semantics explicit in
names where ambiguity is possible.

## Maintainability

Dead code, commented-out production code, speculative generality, and comments
that compensate for unclear code MUST NOT be committed. Comments SHOULD
explain non-obvious intent or constraints, not narrate syntax.

Search before creating a parallel component, service, utility, contract, or
policy. Reuse or extend an existing responsibility when it remains cohesive.
Do not hide meaningful behavior behind generic helpers.

Apply the module ownership, candidate-classification, and utility-bag rules in
`docs/agent-rules/module-cohesion.md`. Size is a review signal, never sufficient
evidence for a split.

Stable seed IDs MUST use named constants owned by their authoritative scope;
cross-scope seed definitions import those contracts instead of duplicating raw
ID strings or selecting IDs by array position. Authoritative validation time
and persisted creation time are distinct concepts and MUST use separately
named values.

## Dependency policy

Before adding a dependency, check:

- whether the repository already provides equivalent functionality;
- maintenance status and release activity;
- package and transitive dependency cost;
- license;
- server/client compatibility;
- known security advisories.

Use one tool per responsibility. Do not add overlapping frameworks or
libraries merely for convenience.
