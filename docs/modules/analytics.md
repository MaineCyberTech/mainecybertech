# Analytics

**Category:** Admin
**API Routes:** `apps/api/src/routes/analytics.ts`
**Frontend:** `apps/web/app/(admin)/admin/store/analytics/**`, `apps/web/lib/catalog/analytics.ts`

## Overview

Store analytics tracking and admin dashboards. Public events are tracked anonymously (no PII), aggregated server-side, and surfaced to admins through summary/dashboard endpoints.

## Key Features

- `POST /api/v1/analytics/track` — anonymous event tracking from the storefront (category views, product views, conversion funnels)
- `GET /api/v1/analytics/csrf` — safe bootstrap that issues the double-submit CSRF cookie the storefront tracker echoes in `X-CSRF-Token` (empty body)
- `GET /api/v1/analytics` — admin analytics dashboard data (auth + admin required)
- `GET /api/v1/analytics/summary` — compact summary metrics for dashboards, backed by the `get_analytics_summary` RPC
- Client-side helpers in `apps/web/lib/catalog/analytics.ts` (event registry, privacy rules). Storefront views fire `store_view`, `category_view` and `product_detail_view`; the service finder fires `quiz_complete`; the quote builder fires `quote_submit`
- The admin page consumes the live `summary()` / `list()` endpoints and shows the static event registry for reference

## Endpoints

| Method | Path                      | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| GET    | /api/v1/analytics/csrf    | Bootstrap the CSRF cookie for tracking   |
| POST   | /api/v1/analytics/track   | Record an anonymous analytics event      |
| GET    | /api/v1/analytics         | Admin analytics dashboard data           |
| GET    | /api/v1/analytics/summary | Admin summary metrics                    |

## Privacy

- Tracking events contain no PII: the route stores page/category/product identifiers only. Visitor IP address and user-agent are never written, and migration `5302441` dropped the `ip_address`/`user_agent` columns (AN-P2-002).
- `store_analytics_events` rows are purged after 90 days by the worker `retention` task (`storeAnalyticsRetentionDays`, AN-P2-004).
- The client helper `track()` is consent-gated: without a stored grant the event stays in the local log and is never sent (PRIV-P2-002). GA/Tawk.to are gated by the consent banner and Google Consent Mode v2 signals (AN-P3-001).
- Event catalog, retention, vendors and the consent record model: [`docs/ANALYTICS_GOVERNANCE.md`](../ANALYTICS_GOVERNANCE.md).
- Admin endpoints are gated by `requireAuth` + `requireAdmin`.
