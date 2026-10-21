# 24_access_control_matrix_audit — Prompt 24 - Access Control Matrix Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `24_access_control_matrix_audit.md` (area ACM, prompt)

## Verification Performed

Domain subagent produced 18 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| ACM-P1-001 | P1 | Client-onboarding mutations run without any `requirePermission` gate |
| ACM-P1-002 | P1 | `profiles.is_super_admin` is user-writable under the RLS self-update policy (forgeable super-admin flag) |
| ACM-P2-001 | P2 | `PLATFORM_ADMIN_KEYS` (org traversal) and `ADMIN_BYPASS_KEYS` (permission bypass) are inconsistent trust sets |
| ACM-P2-002 | P2 | RLS is not a database backstop on API requests (service-role is the default client) |
| ACM-P2-003 | P2 | Write and state-transition actions gated by `view` permissions (action mismatch) |
| ACM-P2-004 | P2 | Webhook endpoint and delivery reads are available to any org member (not manage-gated) |
| ACM-P2-005 | P2 | API keys store `expires_at` but nothing enforces or prunes expiry |
| ACM-P2-006 | P2 | Webhook signing secrets are stored plaintext with no rotation or expiry |
| ACM-P2-007 | P2 | Profiles are enumerable by email/id for any authenticated user |
| ACM-P2-008 | P2 | API-key `permissions` are decorative: keys act with the creator's full permissions and the column is never enforced |
| ACM-P3-001 | P3 | Client-side permission hiding is UI-only for several module actions |
| ACM-P3-002 | P3 | No catalog-lint: referenced permission keys are not checked against the `permissions` table |
| ACM-P3-003 | P3 | Public route surface is broad and has no single documented inventory |
| ACM-P3-004 | P3 | `GET /roles/:id` and `GET /me/permissions` are readable without an admin gate |
| ACM-P3-005 | P3 | RLS policies reference `manage` permissions that no role holds (dead predicates) |
| ACM-P3-006 | P3 | `GET /api-keys` lists org keys for any org member (no `api-keys:view` gate) |
| ACM-P3-007 | P3 | AI copilot endpoints have no permission gate (any org member can run summarization and reply drafts) |
| ACM-P3-008 | P3 | ACM-P3-008 |
