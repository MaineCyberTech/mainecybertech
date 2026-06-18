FROM node:20-alpine AS base
WORKDIR /app

# Copy root package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy API app
COPY apps/api ./apps/api

# Enable pnpm and install dependencies
RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter=./apps/api

# Build the API
WORKDIR /app/apps/api
RUN pnpm build && rm -rf /app/apps/api/node_modules/.cache /root/.local/share/pnpm/store

# Runtime stage
FROM node:20-alpine
RUN addgroup --system --gid 1001 appuser && adduser --system --uid 1001 appuser
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json

RUN corepack enable && corepack prepare pnpm@10 --activate
RUN pnpm install --frozen-lockfile --filter=./apps/api --prod --ignore-scripts

RUN chown -R appuser:appuser /app
WORKDIR /app/apps/api
USER appuser
ENV NODE_ENV=production
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/main.js"]