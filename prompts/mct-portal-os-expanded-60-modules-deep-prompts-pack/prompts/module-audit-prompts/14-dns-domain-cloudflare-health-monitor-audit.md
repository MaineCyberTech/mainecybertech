# Deep Audit / Hardening Prompt: DNS Domain Cloudflare Health Monitor

Audit the **DNS Domain Cloudflare Health Monitor** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Domain, DNS, SSL, SPF, DKIM, DMARC, nameserver, and Cloudflare posture monitoring.
Primary users: MSP admin, web/infrastructure operator
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*dns_domain_cloudflare_health_monitor*.sql`
- `apps/api/src/routes/dns-domain-cloudflare-health-monitor.ts`
- `apps/api/src/validators/dns-domain-cloudflare-health-monitor.ts`
- `apps/api/src/services/dns-domain-cloudflare-health-monitor.ts`
- `packages/sdk/src/dns-domain-cloudflare-health-monitor.ts`
- `apps/web/app/(portal)/portal/dns-domain-cloudflare-health-monitor/**/*`
- `apps/web/components/portal/DnsDomainCloudflareHealthMonitor/**/*`
- `apps/worker/src/tasks/dns-domain-cloudflare-health-monitor.ts` if present
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
