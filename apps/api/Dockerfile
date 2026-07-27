FROM node:24-trixie-slim AS build-dependencies

RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM build-dependencies AS builder

COPY . .
RUN yarn nx run api:build:production

FROM node:24-trixie-slim AS production-dependencies

RUN apt-get update \
  && apt-get install --yes --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /runtime
RUN corepack enable

COPY --from=builder /workspace/dist/apps/api/package.json ./package.json
COPY --from=builder /workspace/dist/apps/api/yarn.lock ./yarn.lock
COPY .yarnrc.yml ./
RUN yarn install --immutable

FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies /runtime/node_modules ./node_modules
COPY --from=builder /workspace/dist/apps/api ./api
COPY --from=builder /workspace/dist/apps/database-cli ./database-cli
COPY --from=builder /workspace/drizzle/migrations ./drizzle/migrations
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint

RUN mkdir -p /data \
  && chown -R node:node /app /data \
  && chmod 755 /usr/local/bin/api-entrypoint

USER node

ENTRYPOINT ["api-entrypoint"]
