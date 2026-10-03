# Health

**Category:** Infrastructure
**API Routes:** `apps/api/src/main.ts`

## Overview

Health check endpoint that pings the database to verify service and data layer connectivity. Used by Docker HEALTHCHECK, load balancers, and monitoring systems to determine service availability.

## Key Features

- Database connectivity verification
- Returns 200 OK on success, 503 on failure
- Used by Docker Compose HEALTHCHECK directive
- Lightweight — no auth required
- Structured response with uptime and status

## Endpoints

| Method | Path    | Description                             |
| ------ | ------- | --------------------------------------- |
| GET    | /health | Health check (pings DB, returns status) |

## Data Model

N/A — reads from Supabase to verify connectivity, no direct table access.

## Access Control

- Public: no authentication required
