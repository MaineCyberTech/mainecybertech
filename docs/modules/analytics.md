# Analytics

**Category:** Admin
**API Routes:** `apps/api/src/routes/analytics.ts`
**Frontend:** `apps/web/app/(admin)/admin/store/analytics/**`, `apps/web/lib/catalog/analytics.ts`

## Overview

Store analytics tracking and admin dashboards. Public events are tracked anonymously (no PII), aggregated server-side, and surfaced to admins through summary/dashboard endpoints.

## Key Features

- `POST /api/v1/analytics/track` — anonymous event tracking from the storefront (category views, product views, conversion funnels)
- `GET /api/v1/analytics` — admin analytics dashboard data (auth + admin required)
- `GET /api/v1/analytics/summary` — compact summary metrics for dashboards
- Client-side analytics helpers in `apps/web/lib/catalog/analytics.ts` (event registry, privacy rules)

## Endpoints

| Method | Path                       | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| POST   | /api/v1/analytics/track    | Record an anonymous analytics event     |
| GET    | /api/v1/analytics          | Admin analytics dashboard data          |
| GET    | /api/v1/analytics/summary  | Admin summary metrics                   |

## Privacy

- Tracking events contain no PII (page/category/product identifiers only)
- Admin endpoints are gated by `requireAuth` + `requireAdmin`
