# Authentication and Security Rules

Registration, login, logout, and session persistence after reload are
mandatory. Registration MUST enforce:

- a non-empty name;
- a trimmed, normalized, case-insensitively unique email;
- password length from 8 through 72 characters;
- authoritative server-side validation.

Names need not be unique. `Ivan@x.com`, `ivan@x.com`, and
`  IVAN@x.com  ` identify the same email. Enforce normalized uniqueness at
the database boundary as well as in application error handling.

Hash passwords with Argon2 or bcrypt. Never store or log plaintext passwords.
Prefer secure HttpOnly cookie sessions; do not put long-lived credentials in
`localStorage`.

Identity and ownership MUST come from the server session. Never trust
client-provided user IDs, owner IDs, roles, memberships, or permission flags.
All protected operations MUST enforce authorization on the server; hiding a
button is not authorization.

Runtime-validate request bodies, path/query parameters, environment variables,
timestamps, pagination, service-worker messages, and notification payloads.
Apply suitable abuse protection to authentication and other sensitive
endpoints, including rate limiting where justified.

Never log passwords, session tokens, authorization headers, VAPID private
keys, full push endpoints, or sensitive meeting content. Secrets MUST come
from validated runtime configuration and MUST NOT enter source, images,
examples, logs, or error responses. `.env.example` contains names and safe
examples only.

Before staging or committing, inspect changed and untracked files for
credentials, private keys, tokens, local databases, generated output, and
large unrelated binaries. Report suspicious paths without printing values.
