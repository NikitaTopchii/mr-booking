# Commit Milestone Plan

This is a planning aid, not a requirement to force future changes into an
inaccurate commit. Generate every final message from its staged diff and use
the explicit `$commit` workflow.

Suggested milestones:

1. `chore(repo): Configure Nx workspace`
2. `chore(runtime): Add validated app startup`
3. `feat(db): Add mandatory booking schema`
4. `chore(db): Seed rooms and demo users`
5. `feat(auth): Register normalized users`
6. `feat(auth): Add persistent user sessions`
7. `feat(booking): Validate booking intervals`
8. `feat(booking): Prevent concurrent slot conflicts`
9. `feat(rooms): Expose seeded room catalogue`
10. `feat(schedule): Add weekly schedule API`
11. `feat(schedule): Add weekly room grid`
12. `feat(booking): Add booking creation flow`
13. `feat(booking): Restrict cancellation ownership`
14. `feat(bookings): Add personal booking history`
15. `feat(ui): Complete mobile booking flow`
16. `test(api): Cover critical booking flows`
17. `docs(repo): Add delivery instructions`

## Commit rules

- Keep infrastructure, behavior, tests, and documentation together when they
  form one reviewable capability; split them when the diff becomes unrelated.
- Never create empty structural milestone commits.
- Do not use the planned subject when the staged diff says something else.
- Do not amend public history or push through `$commit`.
- Every implementation commit must pass the real repository gates once Phase
  1 creates Nx targets.
