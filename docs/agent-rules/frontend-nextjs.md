# Next.js Frontend Rules

Use Next.js App Router. Server Components are the default. Add `"use client"`
only at the smallest boundary that directly needs React state, effects, event
handlers, SWR, browser/service-worker or push APIs, or a client-only library.
Do not convert a page or layout because one nested fragment is interactive.
Client Component props MUST be serializable.

NestJS is the authoritative backend. The web application MUST NOT import the
database, execute Drizzle queries, duplicate booking authorization or
authoritative validation, send Web Push directly, or bypass the API.

## Fetching and cache policy

Initial data SHOULD be rendered on the server where practical. Use meaningful
`loading.tsx`, Suspense boundaries, route error states, empty states, and
expected domain-error states.

SWR owns volatile server state used during interaction, including schedules,
availability, personal bookings, room filters, notification state, and live
updates:

- use `useSWR` for reads;
- use `useSWRMutation` for mutations;
- use `mutate` for revalidation;
- use `SWRConfig fallback` for server-prefetched data;
- create keys through feature-owned key factories.

Do not fetch server state through raw `useEffect` or copy SWR data into Redux,
Zustand, or another global store. Local UI state MAY hold selected dates,
dialogs, draft intervals, and filters.

Every request MUST state its cache behavior:

- room catalogue: cacheable with controlled invalidation;
- schedules and availability: dynamic;
- authenticated user, personal bookings, and notifications: private and
  uncached;
- static configuration: cacheable;
- interactive copies: SWR-managed.

Creation and cancellation remain server-confirmed. Never show success before
the API confirms it.
