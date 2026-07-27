# NestJS and CQRS Rules

NestJS is the authoritative backend. Use CQRS without event sourcing:
commands change state, queries read state, and domain events represent
completed facts or trigger secondary reactions.

Controllers may only read authenticated identity, validate transport input,
create a command/query, call the appropriate bus, and map the result. They
MUST NOT access Drizzle, own transactions, implement authorization or overlap
logic, or send notifications.

Use one handler per externally meaningful use case. Expected names include
`RegisterUserCommand`, `LoginUserCommand`, `LogoutUserCommand`,
`CreateBookingCommand`, `CancelBookingCommand`, `VerifyEmailCommand`,
`CreateRecurringBookingCommand`, `GetWeeklyScheduleQuery`,
`GetMyUpcomingBookingsQuery`, `GetMyPastBookingsQuery`, and `GetRoomsQuery`.

Use typed errors such as `EmailAlreadyExistsError`,
`InvalidCredentialsError`, `EmailNotVerifiedError`,
`InvalidBookingIntervalError`, `BookingOutsideWorkingHoursError`,
`BookingInPastError`, `BookingConflictError`, `BookingNotFoundError`, and
`BookingCancellationForbiddenError`. A centralized mapper MUST expose stable
error codes without raw SQLite errors or stack traces.

Application and domain code depend on ports; infrastructure supplies adapters.
Examples include `BookingRepository`/`SqliteBookingRepository`,
`PasswordHasher`/`ArgonPasswordHasher`, `Clock`/`SystemClock`, and
`IdGenerator`/`UuidGenerator`. Domain code MUST remain free of NestJS
decorators.

Transactions belong to application use cases. Every repository participating
in an operation MUST share its transaction. External network calls,
notification delivery, and slow computation MUST remain outside booking
transactions.

Use domain events for completed facts. When reliable asynchronous delivery is
required, write outbox records in the state-changing transaction and deliver
them afterwards. Do not add a saga without a genuinely long-running,
multi-command workflow requiring orchestration or compensation.
