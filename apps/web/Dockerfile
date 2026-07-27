FROM node:24-bookworm-slim AS dependencies

RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM dependencies AS builder

COPY . .
RUN yarn nx run web:build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /workspace/apps/web/public ./apps/web/public

USER node

CMD ["sh", "-c", "HOSTNAME=0.0.0.0 PORT=\"$WEB_INTERNAL_PORT\" exec node apps/web/server.js"]
