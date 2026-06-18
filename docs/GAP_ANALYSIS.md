# Gap Analysis & Recommendations

> Comprehensive review of the Maine CyberTech Portal monorepo covering tests, code quality, infrastructure, security, and UX.

## Test Summary

**764 unit tests + 24 E2E spec files — all passing**

| Package | Tests         | Framework              |
| ------- | ------------- | ---------------------- |
| API     | 182           | Jest + supertest       |
| SDK     | 108           | Jest (mocked fetch)    |
| Worker  | 24            | Jest                   |
| Web     | 450           | Jest + Testing Library |
| E2E     | 24 spec files | Playwright (chromium)  |

## Strong Areas

| Area             | Status                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| API routes       | 20/20 covered by tests (100%)                                                                                             |
| TypeScript       | 4/4 packages clean `tsc --noEmit`                                                                                         |
| CI/CD validation | All 6 deploy workflows gated (validate + e2e + migrations)                                                                |
| Seed data        | 5 seed files covering all 25+ tables                                                                                      |
| Error tracking   | API (`@sentry/node`) + Web (`@sentry/nextjs`)                                                                             |
| Security         | CORS with credentials, rate limiting (per-user + global), CSP headers, XSS sanitizer, Helmet, Supabase RLS                |
| Infrastructure   | Terraform (12 files), Docker (3 images), SSM secrets (23 parameters), CloudWatch alarms, autoscaling, Slack notifications |
| Documentation    | 30+ docs covering all features                                                                                            |

## Remaining Gaps

### High Impact — Quick Fixes

| #   | Gap                                                                                                                                     | Recommendation                                                                    | Effort | Status  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ | ------- |
| 1   | ~~**No portal ticket detail page link from admin** — admin can view tickets, portal users can view tickets, but there's no cross-link~~ | Add "View in Portal" button on admin ticket detail → `/portal/support/{ticketId}` | 5 min  | ✅ Done |
| 2   | ~~**`"server-only"` missing on some lib files**~~                                                                                       | Add `import "server-only"` to prevent accidental client imports                   | 2 min  | ✅ Done |
| 3   | ~~**Notifications page no unread sync**~~                                                                                               | Add `router.refresh()` after mark-read action                                     | 10 min | ✅ Done |

### Medium Impact

| #   | Gap                                                                                                                                             | Recommendation                                                | Effort |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| 4   | **Tight mobile screens** — subnav pills overflow on very narrow viewports                                                                       | Add `@media (max-width: 360px)` breakpoint for smaller pills  | 15 min |
| 5   | **Permission override UI** — `GET/PUT /users/:id/permissions` API exists but no admin UI to toggle user-level overrides (only read-only matrix) | Add toggle buttons to `PermissionsMatrix`                     | 1-2 hr |
| 6   | **No loading skeletons** — pages show plain "Loading..." text while fetching                                                                    | Replace with skeleton placeholders matching card/table shapes | 1 hr   |

### Low Priority

| #   | Gap                                                                                                   | Recommendation                                    | Effort |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| 7   | **No `global-error.tsx`** — Next.js recommends a root `global-error.js` for App Router error boundary | Create `app/global-error.tsx` with Sentry capture | 15 min |
| 8   | **No bundle analyzer** — can't inspect web bundle size                                                | Add `@next/bundle-analyzer`                       | 15 min |
| 9   | **No favicon** — browser tab shows default Next.js icon                                               | Add favicon/icons from brand assets               | 15 min |

## Feature Roadmap

Features not yet started (see `AGENTS.md` for full list):

| Feature                       | Priority | Notes                                     |
| ----------------------------- | -------- | ----------------------------------------- |
| SSO / OIDC login (SAML/OAuth) | Medium   | Would need `next-auth` or similar         |
| API key management            | Medium   | Self-serve keys for external integrations |
| SLA tracking                  | Medium   | Ticket response/resolution metrics        |
| Internationalization (i18n)   | Low      | All UI is hardcoded English               |
| PWA / offline support         | Low      | Service worker, push notifications        |
| Real-time WebSocket           | Low      | Replace 30s polling with SSE/WS           |

## User-Facing Features — Recommendations

_Updated after admin layout audit and recent feature work._

### Recently Completed

| #   | Feature                                                                                            | Status  |
| --- | -------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Dashboard quick actions** — "Create Ticket" / "Upload Document" buttons                          | ✅ Done |
| 2   | **View in Admin button** — on portal ticket/project/document detail, gated by admin check          | ✅ Done |
| 3   | **Bell dropdown → notification preferences toggle** — inline email toggles per module              | ✅ Done |
| 4   | **View in Portal on ticket detail** — admin ticket detail links to `/portal/support/[ticketId]`    | ✅ Done |
| 5   | **View in Portal per document row** — "Portal" link in admin document list (table/card/list views) | ✅ Done |
| 6   | **Page metadata / titles** — all 35 server component pages now have meaningful `<title>` tags      | ✅ Done |
| 7   | **Loading skeletons** — `loading.tsx` files for admin and portal route groups                      | ✅ Done |

### Portal — High Value (Still Open)

| #   | Feature                                   | Why | Effort |
| --- | ----------------------------------------- | --- | ------ |
| —   | _(all portal high-value items completed)_ |     |        |

### Medium Value

| #      | Feature                                                                                                                  | Why                                                                  | Effort     |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ---------- | ------------ |
| 8      | **Admin list search** — admin tickets, users, projects lists should have search/filter inputs                            | Admins scroll through potentially hundreds of rows without filtering | Small      |
| 9      | **Inline status change** — clicking a status/priority pill opens quick dropdown to change it without entering edit mode  | Admin ticket detail requires clicking "Edit" to change status        | Small      |
| 10     | **Error retry buttons** — error states show a message but no "Try again" button                                          | Users hit dead ends on transient errors                              | Small      |
| 12     | **Admin activity timeline on ticket detail** — show audit events inline instead of requiring navigation to the audit log | Faster triage                                                        | Small      |
| 13     | **Document share link** — generate a signed/expiring link for external parties                                           | Let clients share docs with non-users                                | Small      |
| 14     | **Markdown comment support** — ticket/project comments are plain text, add lightweight rendering                         | Improves communication quality                                       | Small      |
| 15     | **Email notification test button** — admin "Send Test Email" to verify SMTP config                                       | Operational confidence                                               | Small      |
| 16     | **Bulk ticket operations** — select multiple tickets and change status/priority in bulk                                  | No workflow for mass ticket updates                                  | Medium     |
| 18     | **Activity feed on portal** — show recent activity in chronological order on dashboard                                   | Dashboard shows filtered lists, not a timeline                       | Medium     |
| 19     | **Notification audio** — subtle chime when polling finds new unread notifications                                        | No cue when something needs attention                                | Medium     |
| ~~20~~ | ~~**Export tickets/projects to CSV** — same pattern as audit export~~                                                    | ~~Data portability~~                                                 | ~~Medium~~ | ✅ **FIXED** |

## Known Issues

| Issue                                     | Status       | Details                                                                                                     |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `pnpm build` (web) fails on Windows EPERM | Pre-existing | Symlink issue during `standalone` output trace. Does not affect Linux/Docker builds. `pnpm dev` works fine. |
| Auth E2E login test skipped               | Intentional  | Removed timeout-heavy tests; rely on Playwright storageState                                                |
| `@mct/config/typescript` not wired        | Deferred     | Shared tsconfig's `strict` conflicts with codebase; only ESLint config is shared                            |

## Infrastructure Gaps Fixed

During a comprehensive audit the following were identified and fixed:

| Gap                                        | Fix                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| 16 integration secrets not in SSM          | Added Stripe, Sentry, SMTP, Jira, JSM, M365, API_BASE_URL                              |
| ECS task definitions not wired             | Added all optional secrets to `api_secrets`/`worker_secrets` with conditional creation |
| No autoscaling IAM role                    | Added `aws_iam_service_linked_role.autoscaling`                                        |
| Worker Dockerfile no HEALTHCHECK           | Added health check on port 3001                                                        |
| Web Dockerfile missing NEXT_PUBLIC_API_URL | Added `ARG` + `ENV` in build stage                                                     |
| No E2E gate in prod deploys                | Added `e2e.yml` as dependency to all 3 prod workflows                                  |
| Dev deploys no validation                  | Added `validate.yml` as dependency to all 3 dev workflows                              |
| CORS missing credentials                   | Added `credentials: true` to cors middleware                                           |
| `ticket_assignees` non-existent table join | Removed from `tickets.get()` query                                                     |
| Missing `force-dynamic` on pages           | Added to ticket list/detail, approvals, portal support detail                          |
| Logos bucket RLS blocking upload           | Simplified RLS policy; changed storage path                                            |
| Placeholder URLs broken in seed            | Changed `logo_url` to `null` with `onError` fallback in UI                             |

## Audit Findings (2026-06-04)

### Critical Gaps (Must Fix Before Production)

| #   | Issue                                                                               | Location                                 | Severity    | Status       |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------- | ----------- | ------------ |
| 1   | ~~Worker test leaks — process fails to exit gracefully, active timers not cleaned~~ | `apps/worker/src/__tests__/`             | 🔴 Critical | ✅ **FIXED** |
| 2   | ~~SDK test doesn't exit — Jest hangs on async operations~~                          | `packages/sdk/src/__tests__/sdk.test.ts` | 🔴 Critical | ✅ **FIXED** |
| 3   | ~~No `global-error.tsx` — Next.js App Router requires root error boundary~~         | Missing `apps/web/app/global-error.tsx`  | 🔴 Critical | ✅ **FIXED** |
| 4   | ~~No favicon — Browser shows default Next.js icon~~                                 | `apps/web/app/layout.tsx` / `public/`    | 🔴 Critical | ✅ **FIXED** |
| 5   | ~~No bundle analyzer — Cannot inspect web bundle size~~                             | Add `@next/bundle-analyzer`              | 🟡 High     | ✅ **FIXED** |

### Technical Debt

| #   | Issue                                                                       | Location                                                 | Impact      | Status          |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------- | ----------- | --------------- |
| 6   | **0 ESLint warnings** (unused vars, missing deps in hooks, `iconOnly` prop) | `apps/web/`, `apps/api/`, `apps/worker/`                 | Medium      | ✅ Reduced to 0 |
| 7   | `@mct/ui` & `@mct/config` not wired into apps                               | `apps/*/package.json`                                    | Medium      | Pending         |
| 8   | ESLint `MODULE_TYPELESS_PACKAGE_JSON` warnings — need `"type": "module"`    | `apps/api`, `apps/web`, `apps/worker`, `packages/config` | Low         | Pending         |
| 9   | React `iconOnly` prop warning — passed to DOM element                       | `apps/web/components/admin/ProjectTaskListV5.tsx`        | Low         | Pending         |
| 10  | `pnpm build` (web) fails on Windows EPERM — symlink issue (pre-existing)    | `apps/web/next.config.mjs`                               | Known issue | Known           |

### Documentation Gaps

| #   | Issue                                                                                       | File                            | Severity   | Status       |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------- | ---------- | ------------ |
| 11  | ~~Test count discrepancy — AGENTS.md said 733, actual 730~~                                 | `AGENTS.md`                     | Medium     | ✅ **FIXED** |
| 12  | ~~Duplicate docs in `docs/domain-operations/` overlapping with root `docs/`~~               | ~~`docs/domain-operations/`~~   | ~~Medium~~ | ✅ **FIXED** |
| 13  | ~~`README.dev.md` vs `docs/README.dev.md` both exist with overlapping content~~             | ~~Root + `docs/`~~              | ~~Low~~    | ✅ **FIXED** |
| 14  | ~~Historical docs not archived in root~~                                                    | ~~Root directory~~              | ~~Low~~    | ✅ **FIXED** |
| 15  | `docs/INDEX.md` missing key docs (ROLLBACK_PROCEDURES, SECRETS_ROTATION, API_RATE_LIMITING) | `docs/INDEX.md`                 | Medium     | ✅ **FIXED** |
| 16  | `ENVIRONMENT_VARIABLES.md` missing worker vars (`HEALTH_PORT`, `API_BASE_URL`)              | `docs/ENVIRONMENT_VARIABLES.md` | Medium     | ✅ **FIXED** |
