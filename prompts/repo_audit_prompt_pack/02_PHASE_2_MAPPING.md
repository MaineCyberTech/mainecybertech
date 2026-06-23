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
The purpose is to build a highly accurate “this corresponds to that” map.
Be explicit and detailed.
