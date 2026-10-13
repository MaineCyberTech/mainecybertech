# Reconciliation note — 2026-10-12

This run's register is a **living document** (INV-P3-005): after publication it
was reconciled in place against remediation merged into `develop`. The
audit-time artifacts — the domain reports and `RELEASE_GATE.md` — remain
point-in-time snapshots, and `audit_manifest.json` still binds the audited
commit `9c0b88c`.

Binding facts:

- `findings.json` records `generated: 2026-10-11T03:36:51Z`.
- `findings.json`, `risk_register.md` and `follow_up_register.md` were last
  amended by `develop` commit `7a8eb1ce` — "docs(audits): reconcile DR-P2-001
  and INFRA-P2-006 in the full-run register" (2026-10-11T03:40:22Z) — after the
  earlier reconciliation batches (8–20, API-P2-005, NOTIF-P2-002).
- Statuses therefore describe the repository state on 2026-10-11; they are not
  re-verified per later commit, and the manifest's `generatedAt` /
  `scope.commit` still describe the 2026-10-05 audit snapshot.

This note is additive and dated; it does not rewrite the published record.
Policy: `docs/audits/README.md` → Run contract → "Bind every reconciliation".
