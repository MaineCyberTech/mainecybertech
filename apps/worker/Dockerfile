FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base
WORKDIR /app

# Copy root package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy worker app
COPY apps/worker ./apps/worker

# Workspace packages the app depends on (@mct/sdk, @mct/config).
COPY packages ./packages

# Enable pnpm and install dependencies
RUN corepack enable \
 && (corepack prepare pnpm@10 --activate \
     || (sleep 10 && corepack prepare pnpm@10 --activate) \
     || (sleep 20 && corepack prepare pnpm@10 --activate))
RUN pnpm install --frozen-lockfile --filter=./apps/worker

# Build the worker
WORKDIR /app/apps/worker
RUN pnpm build && rm -rf /app/apps/worker/node_modules/.cache /root/.local/share/pnpm/store

# Runtime stage
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/apps/worker/package.json ./apps/worker/package.json

RUN corepack enable \
 && (corepack prepare pnpm@10 --activate \
     || (sleep 10 && corepack prepare pnpm@10 --activate) \
     || (sleep 20 && corepack prepare pnpm@10 --activate))
RUN pnpm install --frozen-lockfile --filter=./apps/worker --prod --ignore-scripts

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
WORKDIR /app/apps/worker
USER appuser
ENV NODE_ENV=production
ENV HEALTH_PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

CMD ["node", "dist/main.js"]
