# Prompt 28 - File Upload and Download Security Audit

@include `00_SHARED_AUDIT_RULES.md`

## Mission

Audit upload, download, preview, export, attachment, signed URL, storage, and file-sharing flows.

This prompt is part of the **Repo Deep-Dive Full Hardening Edition**. It should produce a repository-specific markdown report with evidence-backed findings, practical fixes, tests, documentation updates, and implementation-ready backlog items.

## Output path

Save the final report to:

`docs/audits/{name}/{run}/28_file_upload_download_security_audit.md`

## Area code

Use finding IDs beginning with `FILE`.

Examples:

- `FILE-P0-001`
- `FILE-P1-001`
- `FILE-P2-001`
- `FILE-P3-001`

## Primary audit questions

1. What repository evidence proves the current behavior for upload components?
2. What repository evidence proves the current behavior for download endpoints?
3. What repository evidence proves the current behavior for document routes?
4. What repository evidence proves the current behavior for attachments?
5. What repository evidence proves the current behavior for storage buckets?
6. What repository evidence proves the current behavior for public/private files?
7. What repository evidence proves the current behavior for signed urls?
8. What repository evidence proves the current behavior for metadata?
9. What repository evidence proves the current behavior for mime/extension/size validation?
10. What repository evidence proves the current behavior for content scanning hooks?

## Scope to analyze

- Upload components
- Download endpoints
- Document routes
- Attachments
- Storage buckets
- Public/private files
- Signed URLs
- Metadata
- MIME/extension/size validation
- Content scanning hooks
- Image/PDF/document previews
- Exports
- Tenant scoping
- Revocation
- Deletion/versioning
- Audit logs
- Retention
- CDN/cache
- Tests

## Required special checks

- Flag public buckets for private data
- Check signed URL lifetime
- Check SVG/script/PDF risks
- Require cross-tenant file tests

## Required outputs and companion artifacts

- File surface inventory
- Upload validation review
- Signed URL review
- Export security review
- Required tests

## Step-by-step execution instructions

1. Read the repository tree and identify all files relevant to this domain.
2. Review source files, configuration files, tests, docs, and generated artifacts separately.
3. Create an evidence inventory before writing findings.
4. For each item in scope, determine whether it is implemented, partially implemented, absent, stale, duplicated, unsafe, undocumented, or unknown.
5. Identify strengths before risks so the report is balanced and useful.
6. Create findings only when there is concrete evidence.
7. Assign severity using the shared P0/P1/P2/P3 model.
8. Suggest exact file-level remediation where possible.
9. Suggest tests that would prove the remediation works.
10. Suggest documentation updates needed to keep operators and future AI agents aligned.
11. End with open questions and evidence gaps.

## Evidence collection checklist

- [ ] Reviewed Upload components
- [ ] Reviewed Download endpoints
- [ ] Reviewed Document routes
- [ ] Reviewed Attachments
- [ ] Reviewed Storage buckets
- [ ] Reviewed Public/private files
- [ ] Reviewed Signed URLs
- [ ] Reviewed Metadata
- [ ] Reviewed MIME/extension/size validation
- [ ] Reviewed Content scanning hooks
- [ ] Reviewed Image/PDF/document previews
- [ ] Reviewed Exports
- [ ] Reviewed Tenant scoping
- [ ] Reviewed Revocation
- [ ] Reviewed Deletion/versioning
- [ ] Reviewed Audit logs
- [ ] Reviewed Retention
- [ ] Reviewed CDN/cache
- [ ] Reviewed Tests

## Required report structure

```markdown
# File Upload and Download Security Audit

## Audit Metadata

- Audit name:
- Run:
- Repository:
- Branch:
- Commit SHA:
- Generated at:
- Auditor:
- Area code: FILE
- Output path: docs/audits/{name}/{run}/28_file_upload_download_security_audit.md
- Scope limitations:

## Scope

Describe exactly what was reviewed and what was not reviewed.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
| -------- | ---- | ------------ | ----- |

## Executive Summary

Summarize the current state in plain English. Include strengths, major risks, and recommended next actions.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
| ---- | ------------- | ------- | ------------- | ---- | ----- |

## Domain Scorecard

| Category                       | Score | Evidence | Gap | Recommended action |
| ------------------------------ | ----: | -------- | --- | ------------------ |
| Upload components              |   0-5 | Evidence | Gap | Recommended action |
| Download endpoints             |   0-5 | Evidence | Gap | Recommended action |
| Document routes                |   0-5 | Evidence | Gap | Recommended action |
| Attachments                    |   0-5 | Evidence | Gap | Recommended action |
| Storage buckets                |   0-5 | Evidence | Gap | Recommended action |
| Public/private files           |   0-5 | Evidence | Gap | Recommended action |
| Signed URLs                    |   0-5 | Evidence | Gap | Recommended action |
| Metadata                       |   0-5 | Evidence | Gap | Recommended action |
| MIME/extension/size validation |   0-5 | Evidence | Gap | Recommended action |
| Content scanning hooks         |   0-5 | Evidence | Gap | Recommended action |
| Image/PDF/document previews    |   0-5 | Evidence | Gap | Recommended action |
| Exports                        |   0-5 | Evidence | Gap | Recommended action |

## Detailed Review

For every major item in scope, include:

### Item: Name

- Evidence:
- What it does:
- How it appears to work:
- Dependencies:
- Current controls:
- Missing controls:
- Risks:
- Recommended improvement:
- Suggested tests:
- Suggested docs:

## Scenario / Control Matrix

| ID       | Scenario or control            | Evidence | Current control | Gap | Severity | Recommendation |
| -------- | ------------------------------ | -------- | --------------- | --- | -------- | -------------- |
| FILE-001 | Upload components              | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-002 | Download endpoints             | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-003 | Document routes                | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-004 | Attachments                    | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-005 | Storage buckets                | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-006 | Public/private files           | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-007 | Signed URLs                    | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-008 | Metadata                       | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-009 | MIME/extension/size validation | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-010 | Content scanning hooks         | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-011 | Image/PDF/document previews    | Evidence | Current control | Gap | Severity | Recommendation |
| FILE-012 | Exports                        | Evidence | Current control | Gap | Severity | Recommendation |

## Findings

Use the shared finding format exactly.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
| ---- | -------- | ---------- | ------ | -------- | ---------- |

## Recommendations

Group recommendations into:

### Immediate / Release Blocking

### This Week

### This Month

### Later / Platform Evolution

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
| --------- | ------------ | --------------------- | ---------- |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
| ------------ | -------- | ---------------- | ------ | ---------- |

## Suggested Tests

Include unit, integration, E2E, CI, security, regression, and manual validation ideas as applicable.

## Suggested Documentation Updates

List exact docs to create or update.

## Open Questions

| Question | Why it matters | Evidence needed |
| -------- | -------------- | --------------- |

## Appendix

Include raw inventories, diagrams, Mermaid diagrams, command outputs, or additional notes as needed.
```

## Quality bar

The final report should be detailed enough that an implementation agent can open the report and start creating safe, scoped remediation PRs without needing another discovery pass.
