# Deep Audit / Hardening Prompt: MSP Proposal Builder Pricing Engine

Audit the **MSP Proposal Builder Pricing Engine** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Proposal templates, phases, options, assumptions, pricing scenarios, PDF-ready export, and cover email generation.
Primary users: MSP owner, sales engineer
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*msp_proposal_builder_pricing_engine*.sql`
- `apps/api/src/routes/msp-proposal-builder-pricing-engine.ts`
- `apps/api/src/validators/msp-proposal-builder-pricing-engine.ts`
- `apps/api/src/services/msp-proposal-builder-pricing-engine.ts`
- `packages/sdk/src/msp-proposal-builder-pricing-engine.ts`
- `apps/web/app/(portal)/portal/msp-proposal-builder-pricing-engine/**/*`
- `apps/web/components/portal/MspProposalBuilderPricingEngine/**/*`
- `apps/worker/src/tasks/msp-proposal-builder-pricing-engine.ts` if present
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
