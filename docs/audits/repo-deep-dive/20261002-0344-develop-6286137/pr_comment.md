## repo-deep-dive results - 20261002-0344-develop-6286137

Score: 0/100 (advisory) | Advisory: NO-GO

| Severity | Count |
|---|---|
| P0 | 5 |
| P1 | 56 |
| P2 | 132 |
| P3 | 76 |

Full gate: RELEASE_GATE.md in the run folder.

### Top findings

- **[P0]** DR-P0-001: Scheduled backup and restore-test workflows never run because they are absent from the default branch
- **[P0]** DR-P0-002: The restore test never asserts integrity and therefore cannot fail on a bad backup
- **[P0]** IR-P0-001: No platform-level incident response plan, roles, or postmortem process
- **[P0]** IR-P0-002: No data breach response / notification process
- **[P0]** IR-P0-003: Total loss of the monitoring/alerting path has no independent dead-man's-switch receiver
- **[P1]** ACM-P1-001: Client-onboarding mutations run without any `requirePermission` gate
- **[P1]** ADMIN-P1-001: Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data
- **[P1]** ADMIN-P1-002: Impersonation/cross-tenant access is logged but not reviewable or alerted
- **[P1]** AI-P1-001: Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain
- **[P1]** AI-P1-002: `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers
- **[P1]** BILL-P1-001: Module entitlements are derived but not enforced server-side
- **[P1]** BILL-P1-002: `payments` table is never populated; payment history is silently empty
- **[P1]** BILL-P1-003: Missing Stripe webhook events leave refunds, void, and payment lifecycle unrecorded
- **[P1]** BP-P1-001: `main` requires a context (`Dependency Review`) that no job emits
- **[P1]** BP-P1-002: `enforce_admins:false` lets administrators bypass all required checks and reviews
