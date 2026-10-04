# Post-Merge Re-Audit — 2026-10-04

Consolidated evidence-first report for the post-merge verification re-audit of the
2026-10-03 full-domain runs (`runs/*-20261003-0018-*`) across the seven
MaineCyberTech repositories, plus the deterministic (LLM-free) sweep.

- **Method:** read-only verification per repo at the merged `origin` HEAD, then a
  machine deep sweep (`tools/deterministic_checks.py <repo> --deep`). No secrets printed.
- **Per-repo verification records:** `C:\temp\reaudit\<repo>\VERIFY.md` + `verify.json`.
- **Machine rollup:** `C:\Users\admin\AppData\Local\Temp\opencode\reaudit-sweep\ORG_SUMMARY.md`
  (generated 2026-10-04T17:17:06Z).
- **Reconciled runs:** each original `20261003-0018` run's `follow_up_register.md`,
  `risk_register.md` and `findings.json` now carry the re-audit verdict; all seven
  still pass `tools/check_run.sh`.

## 1. Headline

| Repo | Orig P0 | Orig P1 | P0/P1 closed | still-open | owner-accepted | regressed | VERIFY |
|---|---:|---:|---:|---:|---:|---:|---|
| buddy | 0 | 11 | 8 | 3 | 0 | 0 | `file:///C:/temp/reaudit/buddy/VERIFY.md` |
| chat | 1 | 25 | 26 | 0 | 0 | 0 | `file:///C:/temp/reaudit/chat/VERIFY.md` |
| falcon | 4 | 20 | 17 | 6 | 1 | 0 | `file:///C:/temp/reaudit/falcon/VERIFY.md` |
| falcon-edge | 0 | 3 | 3 | 0 | 0 | 0 | `file:///C:/temp/reaudit/falcon-edge/VERIFY.md` |
| mainecybertech | 1 | 3 | 3 | 1 | 0 | 0 | `file:///C:/temp/reaudit/mainecybertech/VERIFY.md` |
| repo-deep-dive | 0 | 9 | 9 | 0 | 0 | 0 | `file:///C:/temp/reaudit/repo-deep-dive/VERIFY.md` |
| snowride | 0 | 6 | 5 | 1 | 0 | 0 | `file:///C:/temp/reaudit/snowride/VERIFY.md` |
| **Total** | **6** | **77** | **71** | **11** | **1** | **0** | |

`closed`/`still-open`/`regressed` above are the **post-fix** state: the four actionable
still-open P1 items and the two regressions found by the re-audit were fixed during this
cycle (sections 3–4). The raw re-audit verdicts (before those fixes) are in each repo's
`verify.json` and summarised per repo below.

- **No new P0 or P1** was introduced by any merge this cycle.
- **No unresolved regression remains** — the two regressions were fixed and their fixes
  merged (section 3).
- Owner-accepted item (falcon `CI-P1-002`) is plan-gated and intentionally not closed.

## 2. Per-repo detail

### buddy — 0 P0 / 11 P1
Re-audit verdict: **8 P1 closed, 3 still-open, 0 regressed**; P2 14/16 closed, P3 5/5 closed.
Still-open: `CI-P1-002` (branch protection unverifiable from a clone), `EXEC-P1-001`
(derivative gate — an unconditional GO is still unjustified), `SUPPLY-P1-001` (`LICENSE`
is the placeholder `LICENSE - PENDING`). Five new P2/P3 observations (docs drift, red CI
audit job, transitive CVEs, missing `.gitattributes`, SBOM inequality) — no P0/P1.
Evidence: `file:///C:/temp/reaudit/buddy/VERIFY.md`.

### chat — 1 P0 / 25 P1
Re-audit verdict: **P0 1/1 closed, P1 24/25 closed, 1 still-open, 0 regressed**; P2/P3
spot-checks 15/17 closed. The single still-open P1 was `OBS-P1-001` (alerting config
checked in but not wired/deployed) — **fixed by #95** (section 4). Spot-check residuals:
`OBS-P2-004` (no distributed tracing) and `HYG-P3-003` (TODO) — the latter was also
removed by #95. Evidence: `file:///C:/temp/reaudit/chat/VERIFY.md`.

### falcon — 4 P0 / 20 P1
Re-audit verdict: **P0 3/4 closed, 1 still-open (`OBS-P0-001`); P1 14/20 closed, 6
still-open, 0 regressed**. Closed P0s (`FINAL-P0-001`, `HYG-P0-001`, `HYG-P0-002`) are the
release-integrity/publication-equality chain; the 7 not-closed P0/P1 are owner-side
residuals (section 5). Evidence: `file:///C:/temp/reaudit/falcon/VERIFY.md`.

### falcon-edge — 0 P0 / 3 P1
Re-audit verdict: **P1 3/3 closed** (all three are one root cause: non-terminal
revocation on the enrollment path, fixed by PS-001 / #17); **P2/P3 30/39 closed, 9
still-open, 0 regressed**. Note: in the verification clone `origin/main` was `6573de5`
(PR #32); the `#33`–`#41` remediation fixes were content-verified on their branch tips
with merge commits cited. Evidence: `file:///C:/temp/reaudit/falcon-edge/VERIFY.md`.

### mainecybertech — 1 P0 / 3 P1
Re-audit verdict (pre-fix): **P0 1/1 closed; P1 1/4 closed, 3 still-open, 0 regressed**;
P2/P3 spot-check 3/14 closed. During this cycle `SEC-P1-001` and `CI-P1-001` were fixed
(section 4), leaving `FINAL-P1-001` (aggregate) still-open pending a clean production
deploy. `SEC-P2-002` (webhook SSRF) was completed for the worker by #84. Evidence:
`file:///C:/temp/reaudit/mainecybertech/VERIFY.md`.

### repo-deep-dive — 0 P0 / 9 P1
Re-audit verdict: **P1 8/9 closed, 1 regressed, 0 still-open**. The regression
`SUPPLY-P1-001` (unpinned GitHub Actions) is fixed by #39 (section 3); all nine P1s are
now `verified-fixed`. Newer-run P1 (`CI-P1-001`, inert secret gate) is closed. Evidence:
`file:///C:/temp/reaudit/repo-deep-dive/VERIFY.md`.

### snowride — 0 P0 / 6 P1
Re-audit verdict (pre-fix): **P1 3/6 closed, 2 still-open, 1 regressed, 0 P0**. The
regression `DATA-P1-001` (attested migration head behind the repository head) and the
still-open `OBS-P1-001` (schedule only on the host) were fixed by #38 (sections 3–4).
`FINAL-P1-001` remains still-open: its signature half was already closed and #38
re-attested the stale identity (commit + migration head, with a drift guard), but a
signature-tamper release check in CI is still absent. Evidence:
`file:///C:/temp/reaudit/snowride/VERIFY.md`.

## 3. Regressions found and fixed

| Repo | Finding | Regression | Fix PR / commit | Merged as |
|---|---|---|---|---|
| repo-deep-dive | `SUPPLY-P1-001` | Actions SHA pins in `.github/workflows/audit.yml` reverted by #33 (`2626a84`) and `pack-digest.yml` shipped unpinned by #35 (`04aec9e`) | [#39](https://github.com/MaineCyberTech/repo-deep-dive/pull/39) — `7893e39` (re-pin; `84716dd` cites the fix) | `f737019` |
| snowride | `DATA-P1-001` | #29 (`d79d0d7`) added `0057_retire_consumable_category.sql` without advancing `LAUNCH_MIGRATION_HEAD` (`0056`), re-opening the attestation drift | [#38](https://github.com/MaineCyberTech/snowride/pull/38) — `af7f796` (re-pin launch head/commit + drift guard) | `161b09f` |

Both original-run registers now record the regressions as `verified-fixed` with the fix
commit, so no `regressed` verdict remains.

## 4. Actionable still-open items fixed

| Repo | Finding | Was | Fix PR / commit | Merged as |
|---|---|---|---|---|
| mainecybertech | `SEC-P1-001` — PII encryption silently degraded to reversible `plain:` | still-open (fix stranded on `develop`) | [#83](https://github.com/MaineCyberTech/mainecybertech/pull/83) `3e764c5` (prod boot requires 32-byte `FIELD_ENCRYPTION_KEY`) + [#86](https://github.com/MaineCyberTech/mainecybertech/pull/86) `27f1847` (e2e boot) | `18016f7` / `ad0bd88` |
| mainecybertech | `CI-P1-001` — production deploy/migration gate not in force | still-open (docs said no reviewers) | [#83](https://github.com/MaineCyberTech/mainecybertech/pull/83)–[#86](https://github.com/MaineCyberTech/mainecybertech/pull/86) + **required reviewers configured on `prod` and `prod-approval`** (server-side, verified via the GitHub Environments API) | n/a (settings) |
| chat | `OBS-P1-001` — alerting config not wired/deployed | still-open | [#95](https://github.com/MaineCyberTech/chat/pull/95) `6924305` (Prometheus + Alertmanager wired to a live ntfy receiver) | `8a9471b` |
| snowride | `OBS-P1-001` — scheduled detection only on the host | still-open | [#38](https://github.com/MaineCyberTech/snowride/pull/38) `ce3f639` (assurance schedule version-controlled in `infra/ops/crontab`) | `161b09f` |

Additional closures delivered by the same fixes (recorded in the registers):

- **mainecybertech `SEC-P2-002`** (worker DNS-rebinding TOCTOU) — closed by #84 `49646db`
  (`pinnedFetch` on the worker dispatch/retry paths).
- **chat `HYG-P3-003`** (unresolved operational-metrics TODO) — removed by #95.
- **snowride `FINAL-P1-001`** was partially addressed by #38 (stale identity re-attested,
  full-40-hex commit asserted); it remains `still-open` for the missing CI signature-tamper
  release check.

## 5. Owner-side residuals

- **falcon**
  - `CI-P1-002` — branch protection is **not enforceable on the current GitHub plan**
    (403); recorded owner-accepted with compensating controls (`docs/security/BRANCH_PROTECTION.md`).
  - `ARCH-P1-001` — single-host central Compose, no warm standby; deferred large effort.
  - `DATA-P1-001` — Wazuh/IRIS index-retention lifecycle still open on an owner decision.
  - `HYG-P1-001` — `review-package/` still committed; generated-drift check deliberately
    deferred because the committed manifest is already stale against HEAD.
  - `OBS-P0-001` — most `falcon_*` signals still come from the single node-exporter
    textfile collector (OpenSearch/ntfy not scraped directly).
  - `API-P1-001` — edge-pin verification still not vendored/verifiable from a clean clone.
- **buddy** — `SUPPLY-P1-001` `LICENSE` remains `PENDING` (all-rights-reserved placeholder);
  `CI-P1-002` branch protection is server-side and cannot be proven from a clone.
- **falcon-edge** — `AUTH-001` (#40) **held** (identity key file still `0640`); `CI-P2-001`
  branch protection owner-accepted; `ARCH-P2-002` co-tenant single point of failure.
- **mainecybertech** — `FINAL-P1-001` stays open pending a successful dry `main` deploy;
  `CI-P2-003` prod reviewers were configured but the repo docs still need to record the live state.
- **snowride** — `FINAL-P1-001` (CI signature-tamper release check); host-only runtime
  schedule wording in the runbooks now points at the committed crontab.

## 6. Machine re-audit vs baseline

Deep deterministic sweep across the seven repos (post-fix tree).

| Repo | P0 | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|---:|
| buddy | 0 | 1 | 1 | 1 | 3 |
| chat | 0 | 1 | 5 | 3 | 9 |
| falcon | 0 | 0 | 0 | 2 | 2 |
| falcon-edge | 0 | 0 | 0 | 1 | 1 |
| mainecybertech | 0 | 0 | 2 | 2 | 4 |
| repo-deep-dive | 0 | 0 | 5 | 0 | 5 |
| snowride | 0 | 0 | 2 | 2 | 4 |
| **Total** | **0** | **2** | **15** | **11** | **28** |

Baseline was **43 findings / 0 P0 / 3 P1**. The sweep now reports **28 / 0 P0 / 2 P1** —
a net reduction of 15, with **no new P0 and no new P1**. The single P1 reduction is the
removal of one baseline trivy P1 set; the two remaining P1s are dependency findings
(below).

### Residual deterministic backlog

| Class | Where | Detail |
|---|---|---|
| trivy P1 | buddy (2), chat (20) | `postcss`/transitive CVEs in `package-lock.json`; upgrade or record a risk acceptance. |
| trivy P2/P3 | buddy (2/—), chat (15/2) | same dependency tree. |
| gitleaks "hits" | chat (generic-api-key x2, jwt x4), mainecybertech (generic-api-key x35), repo-deep-dive (curl-auth-user x3, generic-api-key x32, sourcegraph-access-token x3), falcon | Predominantly allowlist/marker false positives (test fixtures, example JWTs, docs); `.gitleaks.toml` narrowing still pending on some repos. |
| exec bits | chat (10 scripts), snowride (6 scripts) | tracked `*.sh` without the executable bit. |
| CRLF | snowride (21 files) | index has CRLF; `.gitattributes` line-ending policy needed. |
| unpinned container images | chat (18), falcon (58), mainecybertech (4), snowride (2), repo-deep-dive (5 GitHub Action refs) | digest-pin or waive. |
| Dockerfile lint (hadolint) | chat (6), mainecybertech (6), snowride (3) | shell-form `HEALTHCHECK`, `WORKDIR` and related. |
| `.gitattributes` missing | buddy | no line-ending policy (also falcon-edge/`GIT-P3-001`: no `LICENSE`). |

## 7. Register reconciliation

The seven original runs were reconciled to the re-audit verdicts:

- `closed` → `status=verified-fixed` with note `re-audit 2026-10-04: closed`.
- `still-open` → `status=still-open` (falcon `CI-P1-002` kept `owner-accepted`).
- `regressed` → `verified-fixed` where the fix PR merged (both regressions), with the fix
  commit cited.
- The four actionable still-open items and the two extra same-fix closures are recorded
  with their PR/commit.

Register rows re-stamped and `findings.json` regenerated
(`tools/collect_findings.py <run> --write`). The `follow_up_register.md` (per-finding
Status + Post-audit note) is updated for all seven runs; `risk_register.md` is updated
where it carries a per-finding Status column (buddy, falcon, repo-deep-dive, snowride).
The chat, falcon-edge and mainecybertech risk registers are risk-level / finding-index
only (no per-finding Status), so the follow-up register is their per-finding authority.

| Run | Findings | verified-fixed | still-open | partially-fixed* | open | owner-accepted |
|---|---:|---:|---:|---:|---:|---:|
| buddy-20261003-0018 | 40 | 31 | 5 | 4 | 0 | 0 |
| chat-20261003-0018 | 64 | 42 | 1 | 12 | 9 | 0 |
| falcon-20261003-0018 | 46 | 29 | 8 | 8 | 0 | 1 |
| falcon-edge-20261003-0018 | 42 | 33 | 9 | 0 | 0 | 0 |
| mainecybertech-20261003-0018 | 44 | 16 | 10 | 18 | 0 | 0 |
| repo-deep-dive-20261003-0018 | 41 | 27 | 0 | 14 | 0 | 0 |
| snowride-20261003-0018 | 46 | 32 | 14 | 0 | 0 | 0 |
| **Total** | **323** | **210** | **47** | **56** | **9** | **1** |

\* `partially-fixed`/`open` findings are those the re-audit did not re-verify or left
partial; they were not blanket-promoted. All seven runs pass `tools/check_run.sh`.

## 8. Verification performed

- Per-repo LLM verification at the merged HEAD; evidence is `path:line` / merge PR in
  `C:\temp\reaudit\<repo>\VERIFY.md` and `verify.json`.
- Fix PRs confirmed merged via the GitHub API; merge/head commits and the
  `prod`/`prod-approval` environment protection rules read live (not printed).
- Machine sweep re-run across all seven repos; compared to the archived baseline.
- `bash tools/pack_digest.sh`, `bash tools/lint_pack.sh`, `bash tools/self_test.sh` and
  `tools/check_run.sh` on every archived run: PASS.
- No secrets were printed; no writes were made to the audited repositories.
