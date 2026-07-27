#!/bin/sh
set -eu

node /app/database-cli/main.js validate
node /app/database-cli/main.js migrate

if [ "$SEED_ON_START" = "true" ]; then
  node /app/database-cli/main.js seed
fi

exec node /app/api/main.js
