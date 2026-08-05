# Deep Audit / Hardening Prompt: MSP SOP Library Compliance Mapper

Audit the **MSP SOP Library Compliance Mapper** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Versioned SOP and procedure library mapped to frameworks such as NIST, ISO 27001, CIS, HIPAA-adjacent, PCI-adjacent, and CMMC-readiness.
Primary users: MSP owner, compliance reviewer, technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*msp_sop_library_compliance_mapper*.sql`
- `apps/api/src/routes/msp-sop-library-compliance-mapper.ts`
- `apps/api/src/validators/msp-sop-library-compliance-mapper.ts`
- `apps/api/src/services/msp-sop-library-compliance-mapper.ts`
- `packages/sdk/src/msp-sop-library-compliance-mapper.ts`
- `apps/web/app/(portal)/portal/msp-sop-library-compliance-mapper/**/*`
- `apps/web/components/portal/MspSopLibraryComplianceMapper/**/*`
- `apps/worker/src/tasks/msp-sop-library-compliance-mapper.ts` if present
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
