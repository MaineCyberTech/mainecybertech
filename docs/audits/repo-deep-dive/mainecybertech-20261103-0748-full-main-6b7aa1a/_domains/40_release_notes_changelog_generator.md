# Release Notes and Changelog Generator (re-audit)

## Audit Metadata

- Audit name: mainecybertech
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: MaineCyberTech/mainecybertech (origin/main)
- Commit SHA: `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03T09:43:35Z
- Auditor: subagent (full-domain verification re-audit)
- Area code: REL
- Previous run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Remote evidence: `git ls-remote --tags origin` (18 annotated tags) and the
  public releases atom feed (matching GitHub Releases).

## Executive Summary

The release pipeline now works end to end. The `release.yml` SIGPIPE failure is
fixed and 18 annotated tags plus GitHub Releases exist, with the latest
`v0.1.0-20261103-6b7aa1a`; the release body carries the commit SHA, image refs,
commit list and migration section. The template, rollback docs, deploy/approval
docs and handlebars security entry all verify as fixed.

Remaining problems are release hygiene rather than mechanics:

- `VERSION` is still `0.1.0` after 18 releases and the web app still reports
  `branch-run_number`, so the product version is not a meaningful identity.
- The CHANGELOG tail is stale again (18 non-merge commits after the last
  changelog update), and the UPGRADE window still stops at `5302460` while the
  tree reaches `5302463`.
- One new P3: the tag embeds the workflow run date, so the claimed re-run
  idempotence only holds within the same day.

Counts: 7 verified-fixed, 4 partially-fixed, 1 regressed, 1 new open (P3).

## Findings

| ID | Sev | Title | Status | Evidence |
|---|---:|---|---|---|
| REL-P1-001 | P1 | No version identity | partially-fixed | 18 tags/releases; VERSION 0.1.0; app version branch-run_number |
| REL-P1-002 | P1 | Deploy path/approval claim false | verified-fixed | docs/RELEASING.md:127-156,190-195; deploy-do.yml:648 |
| REL-P2-001 | P2 | CHANGELOG stale for the delta tail | regressed | 18 non-merge commits after a58fb004 absent |
| REL-P2-002 | P2 | Breaking-change/upgrade manifest | partially-fixed | UPGRADE.md:9 window 5302420-5302460 vs tree to 5302463 |
| REL-P2-003 | P2 | No release-notes template | verified-fixed | templates/RELEASE_NOTES_TEMPLATE.md; RELEASING.md:92-96 |
| REL-P2-004 | P2 | Rollback docs stale | verified-fixed | ROLLBACK_PROCEDURES.md:238-262,342-355 |
| REL-P2-005 | P2 | Release docs branch-relationship claim | verified-fixed | RELEASING.md:201-205; main 1 ahead, direction correct |
| REL-P3-001 | P3 | Commit noise / single author | partially-fixed | conventional subjects; 57 bot + 6 agent + 8 dependabot, no 2nd human |
| REL-P3-002 | P3 | PR template lacks versioned-artifact checkbox | partially-fixed | PR template:23 + enforced guard; no versioned-artifact box |
| REL-P3-003 | P3 | handlebars CRITICAL fix missing from CHANGELOG | verified-fixed | CHANGELOG.md:633-637 |
| REL-P3-004 | P3 | Delta entries mislabelled under Fixed | verified-fixed | CHANGELOG.md:12,27,122,130,162 |
| REL-P2-006 | P2 | release.yml fails every run; no tag/release | verified-fixed | release.yml:99-112; 18 tags/releases |
| REL-P3-005 | P3 | Run-date tag breaks same-commit re-run idempotence | open (new) | release.yml:56,62,65-77,149-151 |

## Detailed verification

### Release identity (REL-P1-001)

- `git ls-remote --tags origin` returns 18 tags, from
  `v0.1.0-20261014-b9a7a7c` to `v0.1.0-20261103-6b7aa1a`; the releases atom
  feed shows matching GitHub Releases.
- `VERSION` is still `0.1.0`; every tag shares that version component.
- The web build still sets `NEXT_PUBLIC_APP_VERSION=<branch>-<run_number>`
  (`build-push.yml:207`, `deploy-do.yml:366`).

### CHANGELOG tail (REL-P2-001, regressed)

```
$ git log --oneline -1 -- CHANGELOG.md
a58fb004 chore: resolve develop merge (CHANGELOG union + counts + types digest)
$ git rev-list --no-merges --count a58fb004..HEAD
18
```

Missing examples: `cde79fad` (HIGH prod advisories), `6d747551` (PSF-2.0 +
rate-limit test IP), `d32e5ac7` (real third-party registry digests),
`b2fd32a9` (SBOM validator flag parsing). Grep for `PSF-2.0`,
`HIGH prod advisories` and `real registry digests` in CHANGELOG.md returns 0.

### Release workflow fix (REL-P2-006)

- `release.yml:99-112` no longer pipes `git log` into `head`; it uses
  `--max-count=100` and `sed -n '1,25p'` under `set -euo pipefail`.
- Tags and releases now exist for every promotion, including the current HEAD.

### Tag idempotence (REL-P3-005, new)

`release.yml:56` computes `date=$(date -u +%Y%m%d)` at run time; the tag is
`v<VERSION>-<date>-<short-sha>` (`:62`), and the existence check (`:70`) only
matches that exact tag. A re-run on a later date therefore creates a second
tag/release for the same commit, contradicting `docs/RELEASING.md:86-88`.

## Upgrade / Rollback Notes

- Latest release: `v0.1.0-20261103-6b7aa1a` (GitHub Release + SBOM attached).
- Migrations in this promotion: the tree now has 162 files through `5302463`
  (two files share that version - see EVOL-P1-001). UPGRADE.md covers only
  `5302420`-`5302460`.
- Rollback remains `deploy-do` with `rollback_sha`
  (docs/ROLLBACK_PROCEDURES.md:5-21).
- Operator actions unchanged: prod-approval reviewers/secrets, DO_API_TOKEN,
  `DROPLET_IP` for prod, and the migration window refresh.

## Recommendations

### This week

- REL-P2-001: add changelog entries for the 18 post-`a58fb004` commits (group
  dependency bumps) or record an explicit docs-only N/A; the changelog guard
  only checks the PR checkbox, not the diff.
- REL-P2-002: extend `docs/UPGRADE.md` through `5302463` and resolve the
  duplicate-version migration first (EVOL-P1-001).
- REL-P3-005: derive the tag date from the commit or drop the date; add a
  by-SHA release existence check.

### This month

- REL-P1-001: decide the version-bump policy and wire `VERSION` into
  `NEXT_PUBLIC_APP_VERSION` so the UI badge matches the release tag.
- REL-P3-002: add the versioned-artifact checkbox.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Will VERSION be bumped per promotion or stay SHA-authoritative? | Determines whether tags are true versions | owner decision in docs/RELEASING.md |
| Should docs-only promotions create GitHub Releases? | 18 releases in three weeks with one product version | maintainer decision |
