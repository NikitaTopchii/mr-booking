# Module Cohesion and Utility-Bag Rules

These rules apply to every implementation and refactoring task. They govern
module ownership; type ownership remains governed by `type-placement.md` and
Nx dependency direction by `nx-architecture.md`.

## One reason to change

An implementation module MUST have one primary responsibility and one coherent
reason to change. Related private details MAY remain together when they serve
that responsibility and are not independently meaningful outside it.

Line count, declaration count, or export count alone MUST NOT trigger a split.
Reviewers MUST instead identify distinct change drivers, such as business
policy, generic conversion, persistence queries, transport mapping, security
primitives, UI presentation, or application orchestration.

A module is a utility bag when it collects behavior with different owners or
change drivers merely because the functions are convenient, small, or broadly
reusable. Generic names such as `utils`, `helpers`, or `common` are candidate
signals, not acceptable ownership explanations.

## Candidate classification

Before changing a suspected utility bag, classify it as one of:

- `KEEP`: the declarations support one responsibility and change together;
- `SPLIT`: independently meaningful responsibilities need focused modules;
- `MOVE`: cohesive behavior exists in the wrong owning library or layer;
- `REPLACE_DUPLICATE`: an authoritative implementation already exists;
- `DELETE_DEAD`: the behavior is unreferenced and has no required contract.

The classification MUST be based on imports, consumers, tests, public exports,
and change drivers. Mechanical extraction without an ownership improvement is
prohibited.

## Ownership and dependency direction

Generic reusable behavior MUST live at the narrowest shared ownership boundary
that has no feature-policy dependency. Feature or domain policy MUST remain in
its owning scope and MAY compose generic shared behavior. Shared code MUST NOT
import a feature solely to reuse its policy.

Dependencies MUST point toward the authoritative implementation. Do not retain
parallel implementations, forwarding wrappers, or compatibility barrels unless
a real published contract requires them. Library entry points MUST export only
symbols required by other projects; internal implementation details remain
private.

## Date and time

Generic calendar-date validation, formatting, arithmetic, and named-timezone
conversion belong to the shared date/time boundary. Office timezone constants,
working-week rules, and booking-hour policy belong to the booking domain or the
specific feature that owns them.

Named-timezone conversion MUST use IANA zones and define behavior for ambiguous
local times. Nonexistent local times and invalid input MUST fail with typed,
distinguishable errors. Fixed-offset arithmetic and duplicate `Intl` conversion
loops are prohibited.

## Seeds, adapters, and UI

Seed implementations MUST separate declarative definitions, pure validated plan
construction, persistence, and orchestration. General timezone conversion MUST
NOT be implemented inside a seed.

Independent persistence ports SHOULD have focused adapters when their queries
and change drivers differ. Security primitives SHOULD be separated by the
contract they implement; tightly coupled generation and hashing for the same
credential MAY remain together.

Large feature components MAY keep private subcomponents when they form one
view-level composition and share local state. Split them only when a subview has
an independent contract, lifecycle, ownership, or reason to change. Do not turn
feature code into a directory of one-function files.

Client feature screens that combine independently changing remote queries,
mutations, and substantial presentation SHOULD expose narrow feature-local
hooks and a presentation-safe view contract. Data-access libraries own typed
cache keys and fetchers that decode those keys; feature views MUST NOT depend on
tuple positions, SWR response objects, or transport errors. Shared session
expiry routing belongs to the authentication UI boundary, while feature hooks
decide when to invoke it. Cache invalidation after a mutation MUST target only
the authoritative affected resources.

A complex client feature MUST NOT combine several remote queries, mutation
workflows, router normalization, auth-expiry policy, backend error-code
mapping, substantial adaptive presentation, and calendar algorithms in one
implementation module. Prefer a small feature orchestrator, focused
data/navigation/mutation hooks, a presentation-safe view, cohesive UI
components, pure view-model functions, and feature-owned error and formatting
modules. This rule does not require a separate file for every small JSX
fragment.

## Review and verification

When this rule causes a refactor, tests MUST cover behavior at the new ownership
boundaries. For date/time work this includes invalid calendar input, positive
and negative UTC offsets, daylight-saving gaps, and the explicit overlap policy.

Candidate-audit tooling MAY report suspicious modules using size, export count,
or generic names. It MUST label results as review candidates and MUST NOT fail a
quality gate solely on those heuristics.
