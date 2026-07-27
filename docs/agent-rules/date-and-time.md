# Date and Time Rules

The office timezone is always `Europe/Kyiv`; office hours are `09:00–19:00`.
Persist absolute timestamps in UTC, preferably as integer epoch milliseconds
consistently in SQLite, and return ISO 8601 timestamps through the API. The
browser timezone affects display only.

The server clock is authoritative for future checks, office-hours validation,
slot alignment, duration, overlap, and recurrence generation. Centralize
timezone conversion and make the relevant zone explicit.

Booking intervals are half-open: `[start, end)`. Start and end MUST align to
30-minute boundaries. Duration is 30 minutes through 4 hours. A booking MUST
be wholly inside office hours, in the future, and non-overlapping with an
active booking. Because intervals are half-open, adjacent bookings such as
10:00–11:00 and 11:00–12:00 are valid.

When browser and office zones differ, show the office timezone near the
schedule. Never compare locale-formatted strings, persist locale-formatted
dates, parse ambiguous date strings, trust the browser clock for validation or
security, or duplicate conversion logic across components.

Tests MUST cover timezone conversion and daylight-saving transitions,
including office boundaries and browser/office zone differences.
