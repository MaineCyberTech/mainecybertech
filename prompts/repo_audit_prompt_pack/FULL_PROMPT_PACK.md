# Full Comparative Repo Audit Prompt Pack

This file consolidates the global instruction and all eight phases into one pack for convenient copy/paste into an intelligent AI review or coding agent.

---

# Global Operator Instruction

Treat the current repo as production-sensitive. Regressions are unacceptable unless explicitly justified, risk-assessed, and mitigated.

You are acting as an elite principal software architect, lead DevOps engineer, senior full-stack reviewer, UI/UX auditor, and modernization strategist.

You are auditing two codebases:

1. Reference repo:
   C:\temp\chat

2. Current repo:
   the currently open/active repository in your working context

Your goal is NOT to rewrite recklessly.
Your goal is to deeply compare both repos and identify where the current repo can be safely improved, aligned, or made more similar to the reference repo without breaking anything that currently works.

You must:

- be highly detailed,
- be evidence-driven,
- avoid hand-wavy generalities,
- distinguish fact from hypothesis,
- protect working behavior,
- recommend incremental alignment instead of destructive rewrites.

Always distinguish between:

- copy as-is,
- adapt conceptually,
- not worth porting,
- keep current implementation.

Always call out:

- benefits,
- risk,
- blast radius,
- migration cost,
- test prerequisites,
- rollback concerns.

Never recommend broad rewrites without justification.
Never force symmetry if the current repo is already better.
Never break working contracts without explicitly warning about it.

## Pre-Flight Validation

Before beginning any phase, verify:

- Both repo paths exist and are accessible
- The reference repo (`C:\temp\chat`) matches the expected project
- The current working repo is the correct target for comparison

If either path is invalid or the repos appear misidentified, halt and report the discrepancy before proceeding.

## Optional Ultra-Strict Wrapper

Do not give generic recommendations.
Do not assume.
Do not infer unverified implementation details.
If something is not directly inspectable, label it as uncertain.
Favor preserving working behavior over aesthetic consistency.
Prefer incremental adoption over structural churn.

---

# Phase 1 — Repo Inventory + Structural Baseline

## Purpose

Get the AI to fully inspect both repos and establish a detailed baseline before making recommendations.

## Prompt

Perform Phase 1 only: a deep inventory and structural baseline of both repositories.

Repos to inspect:

1. Reference repo: C:\temp\chat
2. Current repo: the active working repo in context

Your task in this phase is to inspect both repos and produce a highly detailed inventory of:

- top-level folder structure
- apps / packages / services
- frontend areas
- backend areas
- workers / jobs / background tasks
- shared libraries / utilities
- infra and ops files
- CI/CD workflows
- environment/config files
- scripts/tooling
- docs/runbooks/readmes
- test structure
- asset/layout/styling systems
- design system/component organization
- data access patterns
- auth-related areas
- any obvious high-risk or high-complexity zones

For BOTH repos, identify:

- what exists,
- what appears to be core,
- what appears duplicated,
- what appears legacy,
- what appears incomplete,
- what appears especially well organized.

Do NOT recommend changes yet unless a structural issue is impossible not to mention.
This phase is for inspection and baseline only.

### Required output sections

1. Repo A Inventory (reference repo)
2. Repo B Inventory (current repo)
3. Structural Similarities
4. Structural Differences
5. Likely Core Systems
6. Likely Fragile / High-Risk Areas
7. Unknowns / Areas needing deeper inspection in later phases

Be exhaustive.
Do not be generic.
Reference exact folders/files/modules whenever available.
If something cannot be verified, label it as a hypothesis.

### Self-Review

Before concluding Phase 1, review your output and flag:

- Any claim not directly verifiable from the file tree
- Any area you skipped due to size/complexity that warrants deeper inspection
- Any structural issue you felt compelled to mention despite the "no recommendations yet" rule

---

# Phase 2 — Feature / Module / Folder Mapping

## Purpose

Map one repo to the other so the AI understands equivalence, mismatch, gaps, and divergence.

## Prompt

Perform Phase 2 only: explicit mapping between the reference repo and the current repo.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

Using the inventory from Phase 1, create a detailed mapping of equivalent features, modules, directories, and responsibilities between the two repos.

You must identify:

- direct equivalents
- partial equivalents
- renamed equivalents
- missing implementations
- extra implementations in either repo
- mismatched folder structures
- where one repo collapses concerns that the other separates
- where one repo separates concerns more clearly
- where architecture intent appears similar but implementation differs

Focus on:

- frontend app structure
- backend/service/API structure
- shared packages
- utility layers
- auth / access-control areas
- data models / schema-adjacent patterns
- UI component systems
- layout/navigation systems
- scripts/tooling
- tests
- infra/config/docs
- database / schema patterns (migration strategies, RLS policies, seed data, table design)

### Required output format

1. Mapping Summary
2. Folder-to-Folder Mapping
3. Feature-to-Feature Mapping
4. Naming and Organizational Mismatches
5. Missing in Current Repo
6. Missing in Reference Repo
7. Areas That Look Conceptually Similar but Architecturally Different
8. Areas That Cannot Yet Be Mapped Reliably

Do NOT recommend major changes yet.
The purpose is to build a highly accurate "this corresponds to that" map.
Be explicit and detailed.

### Self-Review

Before concluding Phase 2, review your output and flag:

- Any mapping based on folder name similarity rather than actual implementation inspection
- Any area where you're uncertain about the equivalence
- Any feature that exists in one repo but you couldn't find its counterpart (or confirm its absence) in the other

---

# Phase 3 — Best Implementations, Strengths, Weaknesses, and Efficiency Opportunities

## Purpose

Identify what is actually better, what should be copied, adapted, left alone, or avoided.

## Prompt

Perform Phase 3 only: identify strengths, weaknesses, best implementations, and efficiency opportunities.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

Using your prior inventory and mapping, determine:

A. What the reference repo does better
B. What the current repo does better
C. What implementations or patterns in the reference repo are worth bringing into the current repo
D. What should remain untouched in the current repo because it is already working or superior
E. What efficiencies exist in either repo that could safely improve the other

Evaluate across:

- repo organization
- code quality
- abstraction quality
- readability
- modularity
- duplication control
- UI/UX consistency
- design system discipline
- component reuse
- layout/navigation polish
- accessibility/readability
- state/data flow
- API/service patterns
- validation/error handling
- testing discipline
- docs/runbooks
- devex/tooling
- CI/CD
- performance opportunities
- operational simplicity
- config/env hygiene

For every important finding, classify it as:

- copy as-is
- adapt conceptually
- not worth porting
- keep current implementation

### Required output sections

1. Overall Comparative Judgment
2. Best Implementations in Reference Repo Worth Considering
3. Best Implementations in Current Repo That Should Stay
4. Efficiency Opportunities
5. Quality Gaps in Current Repo
6. Quality Gaps in Reference Repo
7. Quick-Win Similarity Opportunities
8. Areas Where Similarity Would Be Counterproductive

Be opinionated, but justify every recommendation.
No hand-wavy statements.
No generic advice without exact context.

### Self-Review

Before concluding Phase 3, review your output and flag:

- Any "copy as-is" recommendation where you haven't verified the source pattern actually works in isolation
- Any recommendation based on assumptions rather than direct code inspection
- Any assessment where you lack sufficient context to make a confident classification

---

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

### Security Posture Comparison

In addition to stability risk, assess the **security posture gap** between the two repos. Compare across:

- **Auth flows** — JWT strategy (local verify vs Supabase getUser), session management, cookie flags (HttpOnly/Secure/SameSite), PKCE exchange
- **Secrets management** — how API keys, tokens, and secrets are stored, injected, and validated (env schemas, .env.example hygiene, CI secret passing)
- **HTTP security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options presence and strictness
- **Input validation** — Zod schema coverage (what % of mutation endpoints are validated), sanitization patterns
- **Rate limiting** — per-endpoint vs global, auth endpoint throttling, configurable limits
- **Dependency vulnerabilities** — compare dependency counts, known vulnerable packages, supply chain risk (lockfile, Dependabot/Renovate config)
- **Database access** — RLS policy coverage, service role key usage patterns, tenant isolation enforcement (requireOrgAccess vs inline checks)
- **Audit logging** — coverage across mutation endpoints, PII exposure in logs, retention strategy
- **Error handling** — stack traces in responses, structured vs ad-hoc error formats, sentry/pino integration

For each dimension, classify as:

- current repo is **stronger**
- reference repo is **stronger**
- **equivalent**
- **unknown** (needs deeper inspection)

### Risk Guardrails

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

### Self-Review

Before concluding Phase 4, review your output and flag:

- Any risk assessment where you lack evidence to estimate blast radius or migration complexity
- Any security dimension you didn't assess due to insufficient visibility into the codebase
- Any "low risk" label that depends on assumptions about test coverage or deployment practices

---

# Phase 5 — Safe Alignment Roadmap

## Purpose

Convert findings into an actual staged engineering strategy.

## Prompt

Perform Phase 5 only: build a safe phased alignment roadmap.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

Your objective is to design a conservative roadmap that makes the current repo more similar to the reference repo where beneficial, while preserving everything that currently works.

This roadmap must prioritize:

- safety
- incremental rollout
- low regression risk
- measurable value
- minimal disruption
- clear sequencing

Organize the roadmap into phases, such as:

- Phase 0: observation only / no changes
- Phase 1: no-risk or near-no-risk wins
- Phase 2: low-risk alignment work
- Phase 3: medium-risk internal convergence
- Phase 4: optional higher-risk strategic modernization
- Phase 5: future-state cleanup or standardization

For each roadmap item include:

- what changes
- why it matters
- which repo pattern inspires it
- what exactly should be preserved
- prerequisites
- test requirements
- rollback considerations
- adoption style: copy / adapt / skip / keep current

### Required output sections

1. Roadmap Summary
2. Immediate Low-Risk Wins
3. Low-Risk Similarity Improvements
4. Medium-Risk Convergence Candidates
5. Optional Strategic Improvements
6. What Must Stay As-Is
7. Recommended Execution Order
8. Minimum Validation Gate Before Each Phase

Be practical, not theoretical.
Make this usable as a real engineering plan.

### Self-Review

Before concluding Phase 5, review your output and flag:

- Any roadmap item that depends on unverified assumptions about the reference pattern
- Any phase with too many items (may indicate insufficient prioritization)
- Any item where the rollback approach is unclear or unstated

---

# Phase 6 — File-by-File / Area-by-Area Change Plan

## Purpose

Turn roadmap items into specific implementation guidance.

## Prompt

Perform Phase 6 only: translate the phased roadmap into concrete file-by-file / area-by-area implementation guidance.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

Based on prior findings, create a detailed change plan that identifies the most likely files, folders, modules, or implementation areas that would be affected by safe convergence work.

Your task is NOT to rewrite everything.
Your task is to provide concrete engineering guidance, such as:

- what to change
- what not to change
- what to mirror from the reference repo
- what to adapt conceptually rather than copy
- what to leave alone entirely
- where shared utilities should be introduced
- where duplication can be safely reduced
- where docs/runbooks should be improved
- where tests should be added before any refactor
- where UI alignment can happen with minimal UX regression

### Required output sections

1. Highest-Priority Target Areas
2. Likely Files/Folders to Touch First
3. Likely Files/Folders to Avoid Touching Early
4. Structural Cleanup Candidates
5. UI/UX Alignment Candidates
6. API/Service Layer Alignment Candidates
7. Shared Utility / Abstraction Candidates
8. Test Coverage Needed Before Refactor
9. Documentation / Runbook Improvements
10. Safe Patch Grouping Proposal

Each item should be concrete and implementation-oriented.
If exact filenames are visible, use them.
If not, reference the most specific path/module area you can verify.

### Self-Review

Before concluding Phase 6, review your output and flag:

- Any file reference you haven't directly verified exists in the repo
- Any change recommendation where the diff between source and target isn't clear
- Any area where you recommend structural changes without sufficient test coverage

---

# Phase 7 — Patch Set Design / Execution Plan

## Purpose

Create an AI-friendly patch sequence so an implementation model can work in controlled batches.

## Prompt

Perform Phase 7 only: design patch sets for safe implementation.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

You are now designing a patch-oriented execution plan for safe adoption of the highest-value improvements.

Create grouped patch sets such as:

- Patch Set 1: no-risk cleanup / organization / docs
- Patch Set 2: low-risk shared utility or component alignment
- Patch Set 3: low-risk UI consistency improvements
- Patch Set 4: medium-risk internal refactors with tests
- Patch Set 5: optional strategic convergence work

For each patch set define:

- objective
- exact areas likely touched
- why this patch set belongs together
- expected benefit
- risk level
- prerequisites
- validation steps
- rollback approach
- whether visual QA is required
- whether integration tests are required

Also create:

1. Top N prioritized recommendations (aim for ~20-25, let findings dictate the count; do not pad or truncate)
2. Quick wins
3. Needs-tests-first list
4. Copy-from-reference list
5. Adapt-don’t-copy list
6. Leave-alone list
7. Best order of execution

Do not produce code yet unless explicitly asked.
This phase is for disciplined implementation planning.

### Self-Review

Before concluding Phase 7, review your output and flag:

- Any patch set where dependencies between files create hidden merge conflicts
- Any "quick win" that has unstated prerequisites or test gaps
- Any recommendation where the rollback approach is impractical or unspecified

---

# Phase 8 — Final Reconciliation / Single Source of Truth Audit

## Purpose

Force synthesis into one authoritative decision document.

## Prompt

Perform Phase 8 only: final reconciliation and single-source-of-truth comparative audit.

Repos:

1. Reference repo: C:\temp\chat
2. Current active repo

Synthesize all earlier phases into one final, highly professional, comprehensive audit.

Your final output must answer:

- What are the biggest architectural and implementation differences?
- Where is the reference repo clearly stronger?
- Where is the current repo clearly stronger?
- What should be adopted immediately?
- What should be phased?
- What should not be touched?
- What creates the biggest value with the least risk?
- What would create hidden migration cost?
- What guardrails must be enforced during any implementation work?

### Required final output sections

1. Executive Summary
2. High-Level Repo Comparison
3. Detailed Mapping Summary
4. Best Implementations Worth Adopting
5. Areas the Current Repo Should Keep As-Is
6. Efficiency Opportunities
7. Risk Register
8. Safe Alignment Roadmap
9. File/Area Change Recommendations
10. Do-Not-Break Guardrails
11. Validation Checklist
12. Final Recommendation

Tone:

- highly technical
- staff+/principal level
- practical
- evidence-driven
- explicit about tradeoffs
- conservative about regressions

This must read like a production-grade comparative audit written for an engineering owner who values precision, safety, and implementation realism.

### Self-Review

Before concluding Phase 8, review your output and flag:

- Any finding carried forward from an earlier phase that you haven't re-validated
- Any recommendation where the tradeoff analysis is one-sided (benefits listed but risks minimized)
- Any section where the evidence is thin but the recommendation is strong
