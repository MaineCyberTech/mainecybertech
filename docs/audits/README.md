# Audit artifacts

This directory holds the **outputs** of the audit prompt packs
(`repo-deep-dive`, `repo_audit_prompt_pack`, `hardening_prompt_pack`,
`portal-alignment`, `mct-portal-os-expanded-60-modules`,
`mct-full-webstore-product-catalog-pack`).

## Run contract (canonical)

Current runs are produced by the `repo-deep-dive` pack and written to:

```
docs/audits/repo-deep-dive/<run>/
  <run> = <name>-<YYYYMMDD>-<HHMM>-<mode>-<branch>-<shortsha>
          e.g. mainecybertech-20261011-0426-full-main-8d299b8
```

Required finals (the pack's `tools/check_run.sh` validates them):

| File                    | Contents                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `INDEX.md`              | Run metadata (target branch/commit), domain table, gate verdict       |
| `EXECUTIVE_SUMMARY.md`  | Headline verdict and top risks                                        |
| `RELEASE_GATE.md`       | Gate verdict (`GO` / `GO WITH CONDITIONS` / `NO-GO`) + blocking set   |
| `risk_register.md`      | One row per finding: ID, severity, title, owner, target, status, note |
| `follow_up_register.md` | Mirror of `risk_register.md`; the finding IDs must match 1:1          |
| `roadmap.md`            | Findings grouped by remediation target                                |
| `patch_plan.md`         | Per-finding remediation recommendation                                |
| `audit_manifest.json`   | Machine manifest — see below                                          |

A run also carries `findings.json` (machine-readable findings with per-finding
status), the domain reports (`NN_<domain>.md`), optional lens reports
(`lens_*.md`), and `source_reports/` for falcon-lab runs.

`audit_manifest.json` required keys: `pack`, `profile`, `run`, `scope`,
`findings`; the full manifest also carries `version`, `promptCount`, `mode`,
`scope.branch` / `scope.commit` / `scope.releaseGate`, and the `findings`
severity/area/total counts.

Finding status vocabulary (registers and `findings.json`): `open`,
`partially-fixed`, `verified-fixed`, `still-open`, `regressed`,
`owner-accepted`.

Rules:

- **Never overwrite a previous run.** A re-audit creates a new `<run>`
  directory; the pack's own directory (`prompts/<pack>/`) only holds the
  _prompts_, never results.
- Reconciliation updates the registers' status columns and `findings.json`; the
  published reports and gate stay point-in-time snapshots.
- **Bind every reconciliation.** A run whose registers or `findings.json` were
  amended after publication carries a dated `RECONCILIATION_<YYYY-MM-DD>.md`
  note in its run directory recording (a) the amendment date, (b) the
  `develop` commit or PR range the statuses reflect, and (c) the fact that
  `audit_manifest.json` still binds the audit-time commit. The note is
  additive: never edit the published reports, gate or manifest to fake the
  layout (INV-P3-005).
- Findings verified as false positives stay in the report with the reason, so
  later runs do not re-raise them.

### Legacy manual packs

The older manual packs use a flat `YYYY-MM-DD` (or `YYYY-MM-DD-<n>`) run name
with a single `report.md` (severity, status `fixed` / `accepted-risk` /
`false-positive` / `open`, file(s) involved, and the fixing commit when
applicable) and no manifest — see the `comprehensive-audit` and
`ui-ux-docs-completeness` rows below. They are kept as historical records and
are not part of the canonical contract above.

## Runs

| Pack                               | Run                                                                      | Entry point                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| comprehensive (manual)             | 2026-08-26                                                               | [`comprehensive-audit/2026-08-26/report.md`](./comprehensive-audit/2026-08-26/report.md)                                                             |
| ui-ux + docs completeness (manual) | 2026-09-27                                                               | [`ui-ux-docs-completeness/2026-09-27/report.md`](./ui-ux-docs-completeness/2026-09-27/report.md)                                                     |
| ui-ux + docs completeness (manual) | 2026-09-27-2                                                             | [`ui-ux-docs-completeness/2026-09-27-2/report.md`](./ui-ux-docs-completeness/2026-09-27-2/report.md)                                                 |
| ui-ux + docs completeness (manual) | 2026-09-27-3                                                             | [`ui-ux-docs-completeness/2026-09-27-3/report.md`](./ui-ux-docs-completeness/2026-09-27-3/report.md)                                                 |
| repo-deep-dive (legacy naming)     | 20261002-0344-develop-6286137                                            | [`repo-deep-dive/20261002-0344-develop-6286137/INDEX.md`](./repo-deep-dive/20261002-0344-develop-6286137/INDEX.md)                                   |
| repo-deep-dive (legacy naming)     | 20261004-0700-main-178b91c                                               | [`repo-deep-dive/20261004-0700-main-178b91c/INDEX.md`](./repo-deep-dive/20261004-0700-main-178b91c/INDEX.md)                                         |
| repo-deep-dive (legacy naming)     | mainecybertech-20261004-full-main-9c0b88c                                | [`repo-deep-dive/mainecybertech-20261004-full-main-9c0b88c/INDEX.md`](./repo-deep-dive/mainecybertech-20261004-full-main-9c0b88c/INDEX.md)           |
| repo-deep-dive                     | mainecybertech-20261011-0426-full-main-8d299b8 (current)                 | [`repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/INDEX.md`](./repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/INDEX.md) |
| repo-deep-dive                     | cross-repo post-merge re-audit (2026-10-04; report, not a run directory) | [`repo-deep-dive/REAUDIT_REPORT_20261004.md`](./repo-deep-dive/REAUDIT_REPORT_20261004.md)                                                           |

The running summary of every audit and its remediation status lives in
[`AGENTS.md`](../../AGENTS.md) under **Known Debt** and **Completed Work**.
