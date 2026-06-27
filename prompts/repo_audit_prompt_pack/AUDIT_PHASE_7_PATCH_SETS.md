# Phase 7 — Patch Set Design / Execution Plan

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat-platform)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT Portal)

---

## 1. Patch Set 1: No-Risk Cleanup / Organization / Docs (Risk: ZERO)

**Objective:** Eliminate technical debt with zero functional impact

**Areas Touched:**
- `package.json` root scripts simplification (→ Chat's pattern)
- `.gitignore` cleanup (137 lines → targeted exclusions)
- README structure alignment

**Why Together:** All are file-level cleanup with no code changes

**Expected Benefit:** Cleaner repo, easier onboarding, consistency with Chat

**Prerequisites:** None

**Validation Steps:**
```bash
pnpm lint && pnpm typecheck && pnpm test
```

**Rollback:** Git revert any file changes

**Visual QA:** Not required

**Integration Tests:** Not required

---

## 2. Patch Set 2: Low-Risk Shared Utility / Component Alignment (Risk: LOW)

**Objective:** Wire shared packages and align utility patterns

**Areas Touched:**
- `apps/api/tsconfig.json` — add package references
- `apps/web/tsconfig.json` — add package references  
- `apps/worker/tsconfig.json` — add package references
- `packages/ui/tsconfig.json` — ensure proper exports
- `packages/config/tsconfig.json` — ensure proper exports

**Why Together:** All are TypeScript config changes that work together

**Expected Benefit:** Consistent types, better linting, IDE support

**Prerequisites:** All packages build independently

**Validation Steps:**
```bash
pnpm typecheck
pnpm lint
pnpm build
```

**Rollback:** Remove `references` and `typeRoots` from tsconfig files

**Visual QA:** Not required

**Integration Tests:** Run all unit tests (`pnpm test`)

---

## 3. Patch Set 3: Low-Risk UI Consistency Improvements (Risk: LOW)

**Objective:** Apply Chat's simpler component patterns

**Areas Touched:**
- `packages/ui/src/components/Button.tsx` — simplify exports
- `packages/ui/src/components/Input.tsx` — simplify exports
- `packages/ui/src/index.ts` — match Chat's export pattern

**Why Together:** All UI component changes that affect consistency

**Expected Benefit:** Simpler imports, better tree-shaking, consistent with Chat

**Prerequisites:** Shared packages wired (Patch Set 2 complete)

**Validation Steps:**
```bash
pnpm lint
pnpm test:web
```

**Rollback:** Revert component export changes

**Visual QA:** Required — check component rendering in Storybook

**Integration Tests:** Component tests in `packages/ui`

---

## 4. Patch Set 4: Medium-Risk Internal Refactors with Tests (Risk: MEDIUM)

**Objective:** Fix production blockers and critical test gaps

**Areas Touched:**
- `infra/terraform/env/prod.tfvars` (NEW from `.example`)
- `infra/terraform/env/backend.prod.hcl` (NEW from `.example`)
- `infra/terraform/env/dev.tfvars` (NEW from `.example`)
- `infra/terraform/env/backend.dev.hcl` (NEW from `.example`)
- `apps/web/__tests__/app/(admin)/admin/webhooks/page.test.tsx` (NEW)
- `apps/web/__tests__/app/(admin)/admin/bulk-invite/page.test.tsx` (NEW)
- `apps/web/__tests__/app/(admin)/admin/health/page.test.tsx` (NEW)
- `apps/web/__tests__/app/(admin)/admin/organizations/[orgId]/billing/page.test.tsx` (NEW)
- `apps/api/src/routes/public.ts` — implement JSM/Teams webhook integration

**Why Together:** All are critical for production deployment readiness

**Expected Benefit:** Unblock CI/CD, production deployments, marketing contact form

**Prerequisites:** Patch Sets 1-3 complete

**Validation Steps:**
```bash
# Terraform validation
cd infra/terraform && terraform init && terraform validate
# All tests pass
pnpm test
# Specific admin tests
pnpm test:web
```

**Rollback:** 
- Delete new tfvars files to restore `.example` state
- Remove test files (they don't break functionality)
- Revert public.ts to previous implementation

**Visual QA:** Required — test marketing contact form end-to-end

**Integration Tests:** 
- Playwright E2E for contact form
- Admin page flow tests

---

## 5. Patch Set 5: Medium-Risk Testing Setup Refactor (Risk: MEDIUM)

**Objective:** Adopt Chat's test setup patterns for maintainability

**Areas Touched:**
- `tests/setup/jest.setup.ts` (NEW)
- `tests/config/jest.config.base.ts` (NEW)
- Mock builder utilities in shared test helpers

**Why Together:** All test infrastructure changes

**Expected Benefit:** Declarative test patterns, easier maintenance, consistency

**Prerequisites:** Patch Sets 1-4 complete; all existing tests pass

**Validation Steps:**
```bash
pnpm test
# Verify test coverage unchanged or improved
```

**Rollback:** Revert test config files, restore previous Jest configs

**Visual QA:** Not required

**Integration Tests:** All existing test suites must pass

---

## 6. Patch Set 6: Optional Strategic Convergence (Risk: MEDIUM-HIGH)

**Objective:** Evaluate and potentially adopt Chat's migration/routing patterns

**Areas Touched:**
- Migration naming (date-based like Chat) — `supabase/migrations/`
- Route group evaluation — `apps/web/app/(admin|portal|public)/`
- TypeScript `:any` sanitization — `apps/web/**/*.tsx`

**Why Together:** Strategic architecture decisions requiring careful evaluation

**Expected Benefit:** Long-term maintainability, consistency with Chat patterns

**Prerequisites:** All Patch Sets 1-5 complete and validated

**Validation Steps:**
```bash
# Migration ordering tests
supabase db diff
# Full test suite
pnpm test
# Manual QA for routing changes
```

**Rollback:** 
- High difficulty for migration changes
- Revert route changes if navigation breaks
- Revert `:any` changes if type issues

**Visual QA:** Required for routing changes

**Integration Tests:** Full E2E suite required

---

## 7. Top 25 Prioritized Recommendations

| # | Recommendation | Priority | Risk | Phase |
|---|---------------|----------|------|-------|
| 1 | Create real prod/dev tfvars files | **CRITICAL** | Zero | 4 |
| 2 | Add admin page tests (webhooks, bulk-invite, health, billing) | **CRITICAL** | Low | 4 |
| 3 | Implement JSM/Teams webhook in public.ts | **HIGH** | Low | 4 |
| 4 | Wire shared packages (@mct/ui, @mct/config) | **HIGH** | Low | 2 |
| 5 | Simplify root package.json scripts | **MEDIUM** | Zero | 1 |
| 6 | Clean up .gitignore to match Chat simplicity | **MEDIUM** | Zero | 1 |
| 7 | Add missing Prettier config | **MEDIUM** | Zero | 3 |
| 8 | Refactor test setup with mock builder | **MEDIUM** | Medium | 5 |
| 9 | Consolidate UI component exports | **LOW** | Low | 3 |
| 10 | Add Storybook for UI components | **LOW** | Low | 3 |
| 11 | Evaluate date-based migration naming | **LOW** | Medium | 6 |
| 12 | Evaluate route group simplification | **LOW** | Medium-High | 6 |
| 13 | TypeScript `:any` sanitization | **LOW** | Medium | 6 |
| 14 | Verify Supabase RLS policies match docs | **LOW** | Zero | 4 |
| 15 | Document API endpoint inventory (exists) | **LOW** | Zero | 1 |
| 16 | Add load testing scripts (placeholder exists) | **LOW** | Low | 6 |
| 17 | Add i18n foundation | **FUTURE** | High | 6 |
| 18 | Add PWA support | **FUTURE** | High | 6 |
| 19 | Mobile optimization | **FUTURE** | Medium | 6 |
| 20 | Calendar view for projects | **FUTURE** | Medium | 6 |
| 21 | API key management (exists) | **LOW** | Zero | 4 |
| 22 | Webhook management (exists) | **LOW** | Zero | 4 |
| 23 | Admin settings/email test (exists) | **LOW** | Zero | 4 |
| 24 | Portal activity feed (exists) | **LOW** | Zero | 4 |
| 25 | Notification audio (exists) | **LOW** | Zero | 4 |

---

## 8. Quick Wins (Can Do Immediately)

| Win | Files | Effort | Impact |
|-----|-------|--------|--------|
| Add Prettier config | Root `.prettierrc.json`, `.prettierignore` | 15 min | Consistency |
| Simplify root scripts | `package.json` | 30 min | DX |
| Clean .gitignore | `.gitignore` | 20 min | Cleanliness |
| Add tfvars files | `infra/terraform/env/*.tfvars` | 60 min | **Unblocks prod** |
| Add admin test skeletons | New test files | 2 hours | **Coverage** |

---

## 9. Needs-Tests-First List

| Area | Current Coverage | Required Before Changes |
|------|------------------|-------------------------|
| Admin webhooks page | 0% | 32 tests |
| Admin bulk-invite page | 0% | 28 tests |
| Admin health dashboard | 0% | 16 tests |
| Admin org billing | 0% | 64 tests |
| JSM/Teams webhook integration | 0% | Integration tests |
| Migration refactoring | N/A | Migration rollback tests |
| Route group changes | N/A | Full E2E navigation tests |

---

## 10. Copy-From-Reference List

| Pattern | From Chat | To MCT |
|---------|-----------|--------|
| Package.json script structure | Root scripts | Root scripts |
| .gitignore simplicity | 22 lines | Prune to essentials |
| tsconfig.base.json structure | Extends pattern | Extends pattern |
| Mock builder utility | vitest.setup.ts | New jest.setup.ts |
| Date-based migration naming | 20260625* format | Consider for new migrations |
| README structure | Chat README | Align MCT README |

---

## 11. Adapt-Don't-Copy List

| Pattern | Chat Approach | MCT Adaptation |
|---------|---------------|----------------|
| Route structure | Flat app/ routes | Keep (admin)/(portal)/(public) groups |
| Package count | 2 packages (config, ui) | Keep 3 packages (sdk, ui, config) |
| Testing runner | Vitest | Keep Jest + Playwright |
| Auth model | Workspace-based | Keep Org-based tenancy |
| Real-time | Socket.io | Keep SSE + WebSocket hybrid |
| Feature flags | Dedicated module | Skip (not needed) |
| PWA support | Full PWA | Skip (not needed) |
| Component exports | Default + named | Keep MCT pattern |

---

## 12. Leave-Alone List

| Area | Reason |
|------|--------|
| Ticket system (comments, 5-min edit) | Core feature, working |
| Document management (versions, shares) | Core feature, working |
| Organization tenancy (multi-org) | Core feature, working |
| Billing/Stripe integration | Core feature, working |
| SLA tracking | Core feature, working |
| Admin panel (15+ pages) | Core feature, working |
| Marketing site + contact form | Core feature, working |
| Auth flow (JWT local + Supabase) | Critical security, working |
| Cross-domain routing (www vs app) | Critical routing, working |
| CI/CD gating (validate + prod-approval) | Critical deployment, working |
| Supabase RLS policies | Critical security, working |
| API versioning (v1) | Contract stability |

---

## 13. Best Order of Execution

```
WEEK 1 - UNBLOCK PRODUCTION
├── Day 1-2: Patch Set 4 (tfvars + admin tests + JSM webhook)
│   └── GATE: terraform validate passes, admin tests >50% coverage
├── Day 3-4: Patch Set 1 (cleanup + docs)
│   └── GATE: lint/typecheck/test all pass
└── Day 5: Patch Set 2 (shared packages wiring)
    └── GATE: typecheck passes with references

WEEK 2 - QUALITY ALIGNMENT
├── Day 1-2: Patch Set 3 (UI consistency)
│   └── GATE: Visual QA in Storybook
├── Day 3-4: Patch Set 5 (test setup refactor)
│   └── GATE: All tests pass with new setup
└── Day 5: Buffer for integration testing

WEEK 3+ - STRATEGIC (OPTIONAL)
├── Evaluate: Patch Set 6 items
│   └── Decision gate: Clear benefit vs risk
└── Execute only if validated
```