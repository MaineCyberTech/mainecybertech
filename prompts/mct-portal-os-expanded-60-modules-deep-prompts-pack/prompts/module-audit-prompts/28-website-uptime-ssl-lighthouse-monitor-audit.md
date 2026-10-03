# Deep Audit / Hardening Prompt: Website Uptime SSL Lighthouse Monitor

Audit the **Website Uptime SSL Lighthouse Monitor** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Monitors website uptime, SSL expiry, performance snapshots, and basic SEO/availability signals.
Primary users: Web admin, MSP operator
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*website_uptime_ssl_lighthouse_monitor*.sql`
- `apps/api/src/routes/website-uptime-ssl-lighthouse-monitor.ts`
- `apps/api/src/validators/website-uptime-ssl-lighthouse-monitor.ts`
- `apps/api/src/services/website-uptime-ssl-lighthouse-monitor.ts`
- `packages/sdk/src/website-uptime-ssl-lighthouse-monitor.ts`
- `apps/web/app/(portal)/portal/website-uptime-ssl-lighthouse-monitor/**/*`
- `apps/web/components/portal/WebsiteUptimeSslLighthouseMonitor/**/*`
- `apps/worker/src/tasks/website-uptime-ssl-lighthouse-monitor.ts` if present
- tests, docs, runbook, API inventory

## Audit categories

1. Tenant isolation and RLS
2. Organization access enforcement
3. Role/permission gating
4. Input validation and output shape
5. Audit logging and timeline events
6. Export/publication safety
7. AI approval gates and draft handling
8. Worker idempotency/retry safety
9. Error handling and observability
10. UI empty/loading/error states
11. Accessibility and responsiveness
12. SDK/API consistency
13. Tests and E2E coverage
14. Documentation/runbook completeness
15. Migration/seed/verification hygiene

## Output format

Return a P0/P1/P2/P3 remediation matrix:

| Severity | Finding | Impacted files | Risk scenario | Fix | Acceptance test |
| -------- | ------- | -------------- | ------------- | --- | --------------- |

Then provide:

- top 5 recommended fixes
- patch order
- missing tests
- documentation gaps
- release readiness verdict
