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
