# Phase 4 — Risk, Stability, and "Do Not Break" Analysis

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat platform)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT Portal)

---

## 1. High-Risk Areas

### **A. Missing Real Environment Configuration (P1 Blocking)**
- **Files:** `infra/terraform/env/dev.tfvars`, `env/prod.tfvars`, `backend.dev.hcl`, `backend.prod.hcl`
- **Blast Radius:** Cannot deploy to dev/prod, CI/CD workflows will fail on `terraform validate`
- **Dependency Chain:** CI → terraform init → plan/apply → deploy images → cluster services
- **Migration Complexity:** Medium - requires creating templates from `.example` files
- **Rollback Difficulty:** High - you won't be able to rollback without valid configs
- **Regression Likelihood:** Medium - manual setup errors would be intermittent
- **Tests Needed First:** None (infrastructure issue, but verify terraform workflows)
- **Manual QA:** Not applicable
- **Environment Parity:** CRITICAL - dev vs prod environments are misconfigured
- **Deployment Behavior:** All infra deployments will fail
- **Auth/Routing/Contracts:** Current infra running, but no real config to verify
- **Root Impact:** This is a **BLOCKER** for any production deployment

### **B. Unit Tests Missing for Admin Pages (P1 Medium)**
- **Files:** `apps/web/__tests__/app/(admin)/admin/webhooks/`, `bulk-invite/`, `health/`, `organizations/[orgId]/billing/`
- **Blast Radius:** Test coverage gap but apps currently work in CI
- **Dependency Chain:** QA coverage → CI confidence → production readiness
- **Migration Complexity:** Low to Medium - adding test files
- **Rollback Difficulty:** Low - adding tests doesn't break existing functionality
- **Regression Likelihood:** Low - new tests protect against regressions
- **Tests Needed First:** All admin page tests (zero coverage)
- **Manual QA:** Not needed if tests pass
- **Environment Parity:** No - tests would run but coverage would remain low until implemented
- **Deployment Behavior:** No impact
- **Auth/Routing/Contracts:** Critical test coverage gap for admin features using auth, routing, API contracts

---

## 2. Medium-Risk Areas

### **C. Shared Packages Not Wired (P2)**
- **Files:** `packages/ui`, `packages/config` not referenced in app `tsconfig.json`
- **Blast Radius:** Type safety and linting consistency across workspace
- **Dependency Chain:** Config → type checking → linting → CI failures
- **Migration Complexity:** Low - wire into each app tsconfig
- **Rollback Difficulty:** Low - reversing is just removing references
- **Regression Likelihood:** Low - adding config references
- **Tests Needed First:** None directly required, but lint/typecheck CI would catch issues
- **Manual QA:** Not needed
- **Environment Parity:** No - affects all environments equally
- **Deployment Behavior:** No impact
- **Auth/Routing/Contracts:** No impact, but reduces consistency

### **D. JSM Ticket Creation (P3)**
- **Files:** `apps/api/src/routes/public.ts`
- **Blast Radius:** Teams contact form webhook/Ticket creation broken
- **Dependency Chain:** Marketing site contact form → broken flow
- **Migration Complexity:** Low - verify config secrets
- **Rollback Difficulty:** Low - this is a feature gap
- **Regression Likelihood:** Low - it's a missing feature
- **Tests Needed First:** New tests for public contact form
- **Manual QA:** Required for marketing contact form
- **Environment Parity:** Important - needs JSM config in all environments
- **Deployment Behavior:** No impact
- **Auth/Routing/Contracts:** No impact, but breaks cross-domain marketing integration

---

## 3. Low-Risk Areas

### **E. `:any` Annotations in Web**
- **Files:** `apps/web/**/*.tsx`
- **Blast Radius:** Type safety reduction, but runtime-safe
- **Dependency Chain:** Code maintainability
- **Migration Complexity:** High - requires manual search/replace
- **Rollback Difficulty:** None needed
- **Regression Likelihood:** Low - accepts no breaking changes
- **Tests Needed First:** None required
- **Manual QA:** Not needed
- **Environment Parity:** No
- **Deployment Behavior:** No impact

### **F. SDK Return Types Any**
- **Files:** `packages/sdk/src/**/*.ts`
- **Blast Radius:** Type safety for SDK users, but runtime-safe
- **Migration Complexity:** Medium - change return types, may break SDK users
- **Rollback Difficulty:** Medium - reverting requires type adjustments
- **Regression Likelihood:** Medium - affects SDK consumer code
- **Tests Needed First:** SDK tests for compatibility
- **Manual QA:** May be needed if SDK used by consumers
- **Environment Parity:** No
- **Deployment Behavior:** No impact except SDK releases

### **G. Development Workflow Integration (Low Priority)**
- i18n, PWA, mobile optimization, calendar view, iOS/android apps
- All are low impact, nice-to-have features

---

## 4. Changes That Need Tests First

1. **Wire shared packages (@mct/ui, @mct/config)** - Critical for CI/CD success
2. **Admin page tests (webhooks, bulk-invite, health, billing)** - Zero coverage blocks validation
3. **Cross-origin JSM ticket creation** - Marketing integration depends on this

---

## 5. Changes That Need Manual QA / Visual QA

1. **All admin pages** - Bulk operations UI, webhook management, billing viewer, health dashboard
2. **Marketing contact form** - Ensure Teams ticket creation flow works
3. **Cross-domain routing** - Verify www.* vs app.* routing works end-to-end

---

## 6. Changes That Could Affect Deployment or Environment Semantics

1. **Real environment config** - BLOCKER for any deployment
2. **Fixing admin/test coverage** - No deployment impact but improves CI health
3. **Shared package wiring** - Improves consistency but no runtime changes

---

## 7. Do-Not-Break Guardrails

- **Auth flows:** Never change `requireOrgAccess`, `requireAdmin`, JWT verification
- **RBAC/tenancy:** Never break Supabase RLS policies
- **API contracts:** Never add new breaking fields to existing endpoints
- **Route structure:** Don't change (public)/(portal)/(admin) groups
- **Environment variables:** Don't remove required ones (JWT_SECRET, DO_TOKEN, etc.)
- **CI/CD workflows:** Don't modify validation gates or approval requirements
- **Cross-domain integration:** Don't break www.* vs app.* routing

---

## 8. Safe Areas for Early Improvement

1. **TypeScript improvements** (`:any` annotations) - safe but high effort
2. **SDK typing improvements** - safe with back-compat for existing users
3. **OpenAPI spec** - low priority, no breaking changes

**IMMEDIATE PRIORITY:** Create real environment config files - this is a BLOCKER for production deployment