# Reconciliation note — 2026-10-12

This run's register is a **living document** (INV-P3-005): after publication it
was reconciled in place against remediation merged into `develop`. The
audit-time artifacts — the domain reports and `RELEASE_GATE.md` — remain
point-in-time snapshots, and `audit_manifest.json` still binds the audited
commit `8d299b8d`.

Binding facts:

- `findings.json` records `generated: 2026-10-11T19:46:45Z`.
- `findings.json`, `risk_register.md` and `follow_up_register.md` were last
  amended by `develop` commit `4a0d4931` — "docs(audits): reconcile the phase-4
  wave + consolidate the changelog" (2026-10-12T05:35:15Z) — after the
  2026-10-11 remediation waves (phase 1–3 reconciliation batches).
- Statuses therefore describe the repository state on 2026-10-12; they are not
  re-verified per later commit, and the manifest's `generatedAt` /
  `scope.commit` still describe the 2026-10-11 audit snapshot.

This note is additive and dated; it does not rewrite the published record.
Policy: `docs/audits/README.md` → Run contract → "Bind every reconciliation".
