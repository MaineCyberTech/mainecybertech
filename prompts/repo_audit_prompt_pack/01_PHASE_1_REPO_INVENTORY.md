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
