# Docker and Runtime Rules

Docker Compose SHOULD provide clean-machine, one-command startup with `web`,
`api`, and a persistent SQLite volume. SQLite does not need a database
container. The database file and its WAL/SHM files MUST share the API-owned
volume; the web service MUST NOT mount it.

Use multi-stage builds, `.dockerignore`, health checks, migrations before
readiness, graceful shutdown, non-root runtime users where practical,
validated environment variables, and no secrets baked into images.

Run one API instance for the SQLite hackathon deployment. Prefer exposing web
and API through one public origin. Deployed PWA, service-worker, and Web Push
functionality requires HTTPS.

README MUST document exact local and Docker startup, migrations, seeds,
runtime configuration, health behavior, persistent storage, and known
deployment limitations.
