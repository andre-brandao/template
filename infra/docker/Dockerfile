# syntax=docker/dockerfile:1
# Build context is the repo root (see compose.yml). This is a Bun workspace
# monorepo with a catalog, so install/build must happen from the root — the
# `@template/*` deps are `workspace:*` and won't resolve in isolation.

FROM oven/bun:1 AS base
WORKDIR /app
# Manifests first so the install layer caches across source edits.
COPY package.json bun.lock bunfig.toml ./
COPY apps/cli/package.json apps/cli/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/core/package.json packages/core/
COPY packages/functions/package.json packages/functions/
COPY packages/sdk/ts/package.json packages/sdk/ts/
COPY packages/ui/package.json packages/ui/
COPY scripts/package.json scripts/
RUN bun install --frozen-lockfile
COPY . .

# Migration image. drizzle-kit needs `node:sqlite`, which Bun doesn't provide,
# so this stage borrows the Node binary purely to run `drizzle-kit migrate`.
# Kept out of the app runtime below so those images stay Node-free.
FROM base AS migrate
COPY --from=node:24-trixie-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app/packages/core
ENTRYPOINT ["node", "node_modules/.bin/drizzle-kit", "migrate"]

# Pre-build the SvelteKit dashboard with adapter-node → apps/dashboard/build.
FROM base AS build
ENV SVELTE_ADAPTER=node
RUN bun run --filter dashboard build

# Single runtime image for every app service. The CLI is the entrypoint; each
# compose service supplies a `serve <api|mcp|dashboard>` verb as its command.
FROM build AS runtime
ENV NODE_ENV=production
WORKDIR /app
ENTRYPOINT ["bun", "run", "apps/cli/src/index.ts"]
CMD ["serve", "dashboard"]
