# Phase 4 — Risk, Stability, and “Do Not Break” Analysis

## Purpose

Force the AI to think like a production owner before any code changes are proposed.

## Prompt

Perform Phase 4 only: risk and stability analysis for any potential alignment or modernization work.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

You are not selecting changes yet. You are assessing the risk of possible changes suggested by earlier analysis.

For every major potential improvement area, assess:

- risk level
- blast radius
- dependency chain
- migration complexity
- rollback difficulty
- likelihood of regression
- which tests are needed first
- whether visual/manual QA is needed
- whether environment parity matters
- whether deployment behavior could change
- whether auth, routing, data, or API contracts could be impacted

Pay special attention to:

- auth flows
- RBAC / tenancy boundaries
- route structure
- env var contracts
- API endpoints
- DB/data assumptions
- CI/CD assumptions
- local dev assumptions
- UI layouts that users already rely on
- shared utility refactors
- moving files/folders that may affect imports, scripts, or build behavior

### Required output sections

1. High-Risk Areas
2. Medium-Risk Areas
3. Low-Risk Areas
4. Changes That Need Tests First
5. Changes That Need Manual QA / Visual QA
6. Changes That Could Affect Deployment or Environment Semantics
7. Do-Not-Break Guardrails
8. Safe Areas for Early Improvement

Be conservative and explicit.
Do not understate risk.
If a change sounds nice but is operationally dangerous, say so clearly.
