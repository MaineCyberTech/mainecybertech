# Audit artifacts

This directory holds the **outputs** of the audit prompt packs
(`repo-deep-dive`, `repo_audit_prompt_pack`, `hardening_prompt_pack`,
`portal-alignment`, `mct-portal-os-expanded-60-modules`,
`mct-full-webstore-product-catalog-pack`).

## Layout contract

Every audit run writes to a dated run directory:

```
docs/audits/<pack-name>/<run>/         # <run> = YYYY-MM-DD (or YYYY-MM-DD-<n>)
  report.md                            # human-readable findings + status
  findings.json                        # machine-readable findings (optional)
  evidence/                            # excerpts, command output, screenshots
```

Rules:

- **Never overwrite a previous run.** A re-audit creates a new `<run>` directory;
  the pack's own directory (`prompts/<pack>/`) only holds the _prompts_, never
  results.
- `report.md` must state, per finding: severity, status
  (`fixed` / `accepted-risk` / `false-positive` / `open`), the file(s) involved,
  and the commit that fixed it when applicable.
- Findings that are verified false positives stay in the report with the reason,
  so later runs do not re-raise them.

## Runs

| Pack                   | Run        | Report                                                                                   |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| comprehensive (manual) | 2026-08-26 | [`comprehensive-audit/2026-08-26/report.md`](./comprehensive-audit/2026-08-26/report.md) |

The running summary of every audit and its remediation status lives in
[`AGENTS.md`](../../AGENTS.md) under **Known Open Issues** and **Completed Work**.
