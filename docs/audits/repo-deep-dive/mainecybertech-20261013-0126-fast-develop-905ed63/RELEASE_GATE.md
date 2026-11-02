# Release Gate

- Target: `mainecybertech` @ `905ed63` (`develop`)
- Run: `mainecybertech-20261013-0126-fast-develop-905ed63`
- Decision: **GO WITH CONDITIONS**

## Basis

- P0 x0, P1 x14, P2 x39, P3 x41 (fast-mode re-audit of the previously registered SEC/CI/SC/DET findings at the current develop head).

## Open P1 findings (block a first production go-live)

| ID | Sev | Title | Note |
|---|---|---|---|
| CI-P1-001 | P1 | Production application deploys have no working manual-approval gate | workflow side complete; GitHub `prod-approval` reviewers not configured (operator) |
| CI-P1-003 | P1 | Production deploy path cannot run; prod environment lacks secrets and protection rules | prod secrets not provisioned (operator) |

## P1 findings verified fixed at 905ed63

| ID | Sev | Title |
|---|---|---|
| CI-P1-002 | P1 | Branch-protection-as-code has a likely-mismatched required check and permits admin bypass |
| SC-P1-001 | P1 | Critical/high advisories persist in the dev dependency tree; `next` override is mis-scoped |
| SEC-P1-001 | P1 | super_admin role can be granted through membership/onboarding/bulk-invite APIs without the /users/:id/role guard |
| SEC-P1-002 | P1 | PII field encryption silently degrades to reversible plaintext |
| SEC-P1-003 | P1 | Org-agnostic `requireAdmin` lets a tenant admin read other tenants' admin data |
| SEC-P1-004 | P1 | Impersonation/cross-tenant access is logged but not reviewable or alerted |
| SEC-P1-005 | P1 | Low-trust MSP role key composes into a cross-tenant read pivot |
| SEC-P1-006 | P1 | Caller-controlled reset redirect composes into an account-takeover assist |
| SEC-P1-007 | P1 | Client-onboarding mutations run without any `requirePermission` gate |
| SEC-P1-008 | P1 | M365 webhook secret is dead config while the real M365 auth value is undocumented and undeployed |
| SEC-P1-009 | P1 | Deploy pipeline does not write several secret-class env vars the API schema and compose reference |
| SEC-P1-010 | P1 | Public file-request upload authorizes with a permission unioned across all orgs |

## Verification required to change the verdict

Re-run the owning domains at the remediated commit and capture artifacts; confirm zero open P0/P1 remains. The two open P1s are operator provisioning items (GitHub Environments), not code blockers.
