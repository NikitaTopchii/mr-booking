# Type Placement Rules

Implementation files MUST NOT own top-level structural `interface` or `type`
declarations. Services, handlers, repositories, seeds, controllers, React
components, hooks, clients, utilities, scripts, and test implementations
import their contracts from a type-focused module.

## Ownership

Place a type at the narrowest boundary that owns its meaning:

1. module-local types live beside the implementation in `types/` or a
   descriptive `*.types.ts` file;
2. types shared inside one Nx library remain library-local;
3. contracts shared by libraries in one business scope belong to that
   scope's domain or contract library;
4. repository-shared placement requires consumers in at least two independent
   scopes, stable scope-neutral meaning, and valid dependency direction.

Never create a generic shared-types dumping ground. Matching fields do not
prove two persistence, domain, HTTP, or view contracts have the same meaning.

Group cohesive declarations, for example
`types/demo-booking-seed.types.ts`; do not create one file per tiny type or
use vague names such as `interfaces.ts`.

## Semantic type files

The following are type-focused when their contents match their name:

- `types/` directories and `*.types.ts`;
- `*.contracts.ts`, `*.dto.ts`, and `*.model.ts`;
- domain `*-contracts.ts`, `*-ports.ts`, and `*-errors.ts`;
- runtime `*.schema.ts`, `*.schemas.ts`, and established `*-schema.ts` files;
- schema-validation modules where exported types are inferred directly from
  the colocated runtime schema;
- dedicated CQRS command and query declaration files.

Domain models, value objects, ports, errors, commands, queries, runtime schemas,
and schema-derived types retain their semantic ownership. They MUST NOT move to
generic shared infrastructure merely to satisfy file organization.

## Imports, exports, and public APIs

Use `import type` for type-only dependencies and `export type` for type-only
public exports. Module-private contracts use direct local imports. Cross-library
contracts use only the owning library's public entry point. Do not expose a
private seed, adapter, or persistence shape through a root barrel.

## Enforcement and exceptions

The root ESLint configuration rejects top-level `interface` and `type`
declarations in implementation files and enforces consistent type imports.
`yarn lint` and `yarn verify:commit` execute this rule.

The only path exception is
`libs/shared/config/src/lib/environment.ts`: `RuntimeEnvironment` is inferred
from the private colocated Zod schema, so splitting it would either expose an
implementation schema or duplicate the runtime contract. New exceptions
require a precise path and documented architectural reason; broad directory
allowlists are prohibited.

Correct:

```ts
// types/demo-booking-seed.types.ts
export interface DemoBookingSeedResult {
  readonly bookingCount: number;
}

// demo-booking-seed.ts
import type { DemoBookingSeedResult } from './types/demo-booking-seed.types';
```

Incorrect:

```ts
// demo-booking-seed.ts
interface DemoBookingSeedResult {
  readonly bookingCount: number;
}
```
