FROM node:20-alpine AS base
WORKDIR /app

# Copy root package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy worker app
COPY apps/worker ./apps/worker

# Enable pnpm and install dependencies
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter=./apps/worker

# Build the worker
WORKDIR /app/apps/worker
RUN pnpm build

# Runtime stage
FROM node:20-alpine
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/apps/worker/package.json ./apps/worker/package.json

RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter=./apps/worker --prod

RUN chown -R appuser:appuser /app
WORKDIR /app/apps/worker
USER appuser
ENV NODE_ENV=production
ENV HEALTH_PORT=3001

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
