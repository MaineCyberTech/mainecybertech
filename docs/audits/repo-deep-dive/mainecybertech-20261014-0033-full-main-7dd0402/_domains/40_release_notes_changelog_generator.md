# Release Notes and Changelog Generator (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `7dd040234e8dfa40dd2d2b6fe1ca7379f2fba097`
- Generated at: 2026-10-14T00:55:01Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: REL
- Previous run: `mainecybertech-20261011-0426-full-main-8d299b8`
- Remote evidence: GitHub API for run/tag/release state (repo is public).

## Executive Summary

The release mechanics exist but do not yet work end to end. The release
workflow, notes template and upgrade manifest are all committed, the SBOM binds
`<VERSION>+<sha>`, and the rollback/deploy docs are accurate. However:

- `release.yml` has **failed on all three `main` pushes** at the release-notes
  step (SIGPIPE from `git log | head -100` under `pipefail`); there are **zero
  tags and zero GitHub Releases**, so the release-notes deliverable has no
  published home (new REL-P2-006, P2).
- The CHANGELOG tail and the UPGRADE migration window are stale again relative
  to HEAD (REL-P2-001, REL-P2-002 regressed), and the release docs' promotion
  binding now states the branch relationship backwards (REL-P2-005 regressed).
- The handlebars CRITICAL override is still absent from the changelog
  (REL-P3-003 open).

Counts: 4 verified-fixed, 3 partially-fixed, 3 regressed, 1 open (REL-P3-003),
1 new open (REL-P2-006).

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| REL-P1-001 | P1 | No version identity | partially-fixed | 0 tags/0 releases; release.yml fails (REL-P2-006); VERSION 0.1.0; badge uses ref-run_number |
| REL-P1-002 | P1 | Deploy path/approval claim false | verified-fixed | docs/RELEASING.md:100-115,176; deploy-do.yml:648 |
| REL-P2-001 | P2 | CHANGELOG stale for the delta tail | regressed | 5 commits after 00c447f6 absent (07e9ce09, 62a09bac, bumps, 673d76cb) |
| REL-P2-002 | P2 | Breaking-change/upgrade manifest | regressed | UPGRADE.md:9 window 5302420-5302446 vs tree to 5302460 |
| REL-P2-003 | P2 | No release-notes template | verified-fixed | templates/RELEASE_NOTES_TEMPLATE.md; RELEASING.md:92-96 |
| REL-P2-004 | P2 | Rollback docs stale | verified-fixed | ROLLBACK_PROCEDURES.md:234-257,340-350 |
| REL-P2-005 | P2 | Release docs branch-relationship claim | regressed | RELEASING.md:183-186 + AGENTS.md:124; main is 7 ahead of develop |
| REL-P3-001 | P3 | Commit noise / single author | partially-fixed | conventional non-merge subjects; 190 bot + 3 dependabot, no second human |
| REL-P3-002 | P3 | PR template lacks versioned-artifact checkbox | partially-fixed | PULL_REQUEST_TEMPLATE.md:23 only; no enforcement |
| REL-P3-003 | P3 | handlebars CRITICAL fix missing from CHANGELOG | open | package.json:73; 0 handlebars hits in CHANGELOG/HISTORY/AGENTS |
| REL-P3-004 | P3 | Delta entries mislabelled under Fixed | verified-fixed | CHANGELOG.md:12,27,105,137,518 classify correctly |
| REL-P2-006 | P2 | release.yml fails every run; no tag/release | open (new) | 3/3 runs failed at notes step; 0 tags; exit 141 reproduced locally |

## Upgrade / Rollback Notes

- No tag or GitHub Release exists; the last shipped state is the GHCR image
  set tagged with the deploying commit SHA (`7dd0402`). Rollback remains
  `deploy-do` with `rollback_sha` (docs/ROLLBACK_PROCEDURES.md:5-21).
- Operator actions still pending (unchanged): `prod-approval` required
  reviewers, `DO_API_TOKEN`/`DROPLET_IP` for prod, and the migration window
  refresh (REL-P2-002).

## Recommendations

### Immediate / release blocking

- REL-P2-006: fix the `head`-truncated pipelines in `release.yml` (`:103`,
  `:109`) and re-run the workflow so the first tag/release can be cut. This
  unblocks REL-P1-001.

### This week

- REL-P2-001: add changelog entries for the tail commits (07e9ce09, 62a09bac,
  673d76cb; dependency bumps can be grouped) or record the docs-only N/A.
- REL-P2-002: extend `docs/UPGRADE.md` to 5302460 and update the window line.
- REL-P2-005: refresh the promotion binding in `docs/RELEASING.md:183-186` and
  `AGENTS.md:124` (or drop it and keep the compare instruction).
- REL-P3-003: add the handlebars override to the Security/Fixed entries.

### This month

- REL-P3-002: add a versioned-artifact checkbox and consider a changelog-diff
  advisory so the tail cannot silently rot again.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will VERSION be bumped per promotion or stay SHA-authoritative? | Determines whether the tag scheme alone is the release identity | owner decision in docs/RELEASING.md |
| Is the audit-corpus publish commit (62a09bac) meant to be release-noted? | Defines the changelog scope for docs-only commits | maintainer decision |
