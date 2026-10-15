# 26_admin_console_abuse_case_audit — Prompt 26 - Admin Console Abuse Case Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `26_admin_console_abuse_case_audit.md` (area ADMIN, prompt)

## Verification Performed

Domain subagent produced 16 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| ADMIN-P1-001 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data |
| ADMIN-P1-002 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted |
| ADMIN-P1-003 | P1 | Role assignment paths let a delegated user-manager grant cross-tenant admin roles (self-escalation) |
| ADMIN-P2-001 | P2 | Sensitive admin exports are not audit-logged |
| ADMIN-P2-002 | P2 | Destructive deletes are inconsistently confirmation-gated and org delete is unrecoverable |
| ADMIN-P2-003 | P2 | Bulk document operations apply without a per-row preview or elevation guardrail |
| ADMIN-P2-004 | P2 | Bulk invite creates pre-confirmed auth accounts (and org onboarding auto-approves admin) |
| ADMIN-P2-005 | P2 | No rate limiting specific to expensive/destructive admin operations |
| ADMIN-P2-006 | P2 | No undo/soft-delete is exercised despite the schema supporting it |
| ADMIN-P2-007 | P2 | Approval flows allow self-approval and cancellation of already-approved requests |
| ADMIN-P2-008 | P2 | Destructive deletes are not consistently audit-logged |
| ADMIN-P2-009 | P2 | Any org member can open the Stripe billing portal for their org (no billing-contact check) |
| ADMIN-P3-001 | P3 | Web admin gate accepts a broader role set than the API `requireAdmin` (guard/API divergence) |
| ADMIN-P3-002 | P3 | Active-org cookie setter performs no server-side authorization |
| ADMIN-P3-003 | P3 | Admin global search and dashboard expose global resource names/counts to any admin |
| ADMIN-P3-004 | P3 | Global store catalog is mutable by any tenant admin |
