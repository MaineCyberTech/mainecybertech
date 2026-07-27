# Deep Audit / Hardening Prompt: Security Incident Response Runbook App

Audit the **Security Incident Response Runbook App** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Guided incident response workspaces for phishing, account compromise, malware, lost device, unauthorized access, and ransomware suspicion.
Primary users: Incident lead, technician, client executive
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*security_incident_response_runbook_app*.sql`
- `apps/api/src/routes/security-incident-response-runbook-app.ts`
- `apps/api/src/validators/security-incident-response-runbook-app.ts`
- `apps/api/src/services/security-incident-response-runbook-app.ts`
- `packages/sdk/src/security-incident-response-runbook-app.ts`
- `apps/web/app/(portal)/portal/security-incident-response-runbook-app/**/*`
- `apps/web/components/portal/SecurityIncidentResponseRunbookApp/**/*`
- `apps/worker/src/tasks/security-incident-response-runbook-app.ts` if present
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
|---|---|---|---|---|---|

Then provide:

- top 5 recommended fixes
- patch order
- missing tests
- documentation gaps
- release readiness verdict
