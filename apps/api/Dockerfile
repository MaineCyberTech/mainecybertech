FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base
WORKDIR /app

# Copy root package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy API app
COPY apps/api ./apps/api

# Workspace packages the app depends on (@mct/sdk, @mct/config). Currently
# only imported for types, but copy them so the workspace resolves.
COPY packages ./packages

# Enable pnpm and install dependencies
RUN corepack enable \
 && (corepack prepare pnpm@10 --activate \
     || (sleep 10 && corepack prepare pnpm@10 --activate) \
     || (sleep 20 && corepack prepare pnpm@10 --activate))
RUN pnpm install --frozen-lockfile --filter=./apps/api

# Build the API
WORKDIR /app/apps/api
RUN pnpm build && rm -rf /app/apps/api/node_modules/.cache /root/.local/share/pnpm/store

# Runtime stage
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json

RUN corepack enable \
 && (corepack prepare pnpm@10 --activate \
     || (sleep 10 && corepack prepare pnpm@10 --activate) \
     || (sleep 20 && corepack prepare pnpm@10 --activate))
RUN pnpm install --frozen-lockfile --filter=./apps/api --prod --ignore-scripts

# Runtime hardening (CTR-P1-001): drop npm/corepack/pnpm — the app runs `node`
# directly. npm's bundled tree (tar 6.2.1 CRITICAL, minimatch, brace-expansion,
# pacote, sigstore) and the corepack pnpm cache were the entire node-package
# source of the image-scan findings; libcrypto3/libssl3 carry an Alpine fix.
RUN apk upgrade --no-cache libcrypto3 libssl3 \
 && rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/pnpm /usr/local/bin/yarn /usr/local/bin/yarnpkg \
           /root/.cache/node/corepack

RUN chown -R appuser:appuser /app
WORKDIR /app/apps/api
USER appuser
ENV NODE_ENV=production
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/health"]

CMD ["node", "dist/main.js"]