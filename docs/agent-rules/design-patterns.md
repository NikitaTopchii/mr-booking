# Design Pattern Rules

Refactoring Guru MAY be used as a reference for pattern intent,
applicability, trade-offs, and code smells. Patterns MUST solve a concrete
present problem and MUST NOT decorate the architecture.

Before introducing a pattern, document:

1. the concrete problem;
2. the simplest direct solution;
3. why that solution is insufficient;
4. the selected pattern;
5. the complexity introduced.

When justified, approved patterns include:

- Command for an explicit state-changing use case;
- Query for an explicit read use case;
- Repository for an aggregate persistence boundary;
- Adapter for an external implementation behind a port;
- Strategy for a real interchangeable policy;
- Factory when construction has meaningful variation or invariants;
- Observer/Domain Event for completed facts and secondary reactions;
- Specification/Policy for named, independently testable business rules;
- Facade for a genuinely complex subsystem boundary;
- Builder for complex test fixtures.

The following are prohibited:

- interfaces without a meaningful boundary;
- factories that only call `new`;
- strategies for trivial conditions;
- event buses for one direct synchronous call;
- mutable global singletons;
- inheritance used only to share a few lines;
- generic repositories spanning unrelated aggregates;
- event sourcing merely because CQRS is used.

Review changed code for duplicated business rules, long methods, large
classes, primitive obsession, feature envy, shotgun surgery, divergent
change, duplicated conditionals, dead code, speculative generality, and
comments compensating for unclear code.
