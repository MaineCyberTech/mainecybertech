# Phase 5 — Safe Alignment Roadmap

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat-platform)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT Portal)

---

## 1. Roadmap Summary

**Core Finding:** MCT Portal is a mature evolution from Chat Platform, but has specific gaps:
- Production blocks (missing env configs, admin tests)
- Some pattern improvements from Chat (simpler package.json, testing setup, migration structure)
- Shared packages (@mct/ui, @mct/config) not wired into apps

**Strategy:** Conservative, incremental alignment focused on fixing production blocks and adopting Chat's high-quality patterns while preserving MCT's enterprise features.

---

## 2. Immediate Low-Risk Wins (Phase 1)

### **WIN 1: Fix Production Environment Config (BLOCKER)**
- **What:** Create real `env/prod.tfvars`, `backend.prod.hcl` and `env/dev.tfvars`, `backend.dev.hcl` from `.example` files
- **Why:** Without real configs, `terraform validate` fails - MCT cannot deploy to production
- **Inspired By:** Chat has these files pre-configured
- **What to Preserve:** All existing DO variables, CloudFlare DNS, existing secrets
- **Prerequisites:** None
- **Tests:** Run `terraform validate` CI workflow; verify terraform plan
- **Rollback:** Can revert entire infra deploy by removing configs
- **Adoption:** Adapt (use examples with real values)
- **Impact:** CRITICAL - production deploy enabled

### **WIN 2: Add Admin Page Tests (Defensive)**
- **What:** Add Jest + Playwright tests for admin/webhooks, bulk-invite, health, organizations/[orgId]/billing
- **Why:** Zero test coverage risks regression; CI confidence needed
- **Inspired By:** Chat's test structure and patterns
- **What to Preserve:** MCT's existing admin feature logic and contracts
- **Prerequisites:** Basic Jest/Playwright setup in web app
- **Tests:** Create full coverage before advancing CI gates
- **Rollback:** Easy - removing test files doesn't break functionality
- **Adoption:** Copy test patterns from Chat, adapt to MCT admin features
- **Impact:** Medium - improves QA but no functional changes

---

## 3. Low-Risk Similarity Improvements (Phase 2)

### **SIM 1: Wire Shared Packages (@mct/ui, @mct/config)**
- **What:** Add `@mct/ui` and `@mct/config` to all app `tsconfig.json` files
- **Why:** Consistency across workspace, better lint/typecheck
- **Inspired By:** Chat's direct package references in tsconfig
- **What to Preserve:** MCT's specific component and config needs
- **Prerequisites:** Lint/typecheck currently passing
- **Tests:** Run `pnpm lint` and `pnpm typecheck` CI validation
- **Rollback:** Remove from tsconfig
- **Adoption:** Copy Chat's pattern of `"@chat/ui": "workspace:*"`
- **Impact:** Low - improves consistency, no functional changes

### **SIM 2: Simplify Root Package Scripts**
- **What:** Copy Chat's pattern for common scripts, keep MCT-specific additions
- **Why:** Cleaner root configuration, easier onboarding
- **Inspired By:** Chat's simple, clear scripts in package.json
- **What to Preserve:** MCT's `ci`, `bootstrap`, and enterprise-specific scripts
- **Prerequisites:** All apps building correctly
- **Tests:** `pnpm test` and build scripts should still work
- **Rollback:** Restore MCT scripts after changes
- **Adoption:** Adapt Chat's pattern to MCT scope
- **Impact:** Low - improves developer experience

---

## 4. Medium-Risk Convergence Candidates (Phase 3)

### **CONVERGE 1: Testing Approach Refactoring**
- **What:** Refactor test setup to include Chat's mock builder utilities
- **Why:** More declarative test definitions, easier maintenance
- **Inspired By:** Chat's `tests/setup/vitest.setup.ts` pattern
- **What to Preserve:** MCT's comprehensive test coverage and patterns
- **Prerequisites:** All existing tests passing; migrate gradually
- **Tests:** Migrate test utilities incrementally, verify test behavior
- **Rollback:** Can revert mock builder changes while keeping new structure
- **Adoption:** Adapt Chat's declarative approach to MCT's complex features
- **Impact:** Medium - improves test maintainability

### **CONVERGE 2: Migration Structure Simplification**
- **What:** Migrate to date-based migration naming (like Chat) while preserving MCT's migration count
- **Why:** Clearer migration history and rollback paths
- **Inspired By:** Chat's `20260625*` migration naming
- **What to Preserve:** MCT's greater number of migrations (more complex changes)
- **Prerequisites:** `supabase db push` working, migrations existing
- **Tests:** Verify migration ordering and rollback capabilities
- **Rollback:** High - migrating could break migration sequence
- **Adoption:** Adapt naming pattern while preserving MCT's content
- **Impact:** Medium - improves migration management

---

## 5. Optional Strategic Improvements (Phase 4)

### **STRAT 1: Routing Architecture Alignment**
- **What:** Consider aligning route groups with Chat's simpler structure
- **Why:** Current `(admin)/(portal)/(public)` works but may have duplication
- **Inspired By:** Chat's flat route structure
- **What to Preserve:** MCT's multi-domain routing (www vs app) and authentication
- **Prerequisites:** Cross-domain routing thoroughly tested
- **Tests:** Manual QA for route access, auth flows
- **Rollback:** High - user navigation patterns depend on current structure
- **Adoption:** Only if chat's patterns offer clear advantages
- **Impact:** High - could affect user navigation

### **STRAT 2: TypeScript Sanitization**
- **What:** Reduce `:any` annotations in MCT web code (security improvement)
- **Why:** Better type safety, maintainability
- **Inspired By:** Chat's lower `:any` usage
- **What to Preserve:** MCT's functionality - same behavior, better typing
- **Prerequisites:** No runtime behavior changes allowed
- **Tests:** Comprehensive test coverage before refactoring
- **Rollback:** Can keep `:any` if problems arise
- **Adoption:** Gradual, test-first refactoring
- **Impact:** Medium - code quality improvement with risk

---

## 6. What Must Stay As-Is

### **NON-NEGOTIABLE ELEMENTS**

**A. Enterprise Features (Never Change)**
- Ticket system with comments + 5-min editing window
- Document management with versions + sharing links
- Organization-based tenancy (multi-tenancy)
- Billing/Stripe integration
- SLA tracking metrics
- Admin panel (15+ pages)
- Marketing site + contact form integration

**B. Architecture Foundation (Critical for Platform)**
- `(admin)/(portal)/(public)` route groups
- Cross-domain routing: `www.*` vs `app.*`
- Auth flow: JWT local verification + Supabase fallback
- `requireOrgAccess` middleware for tenancy isolation
- Shared package system (@mct/sdk, @mct/ui, @mct/config)
- GitHub Actions gating (validate + prod-approval)

**C. Production Contract (Cannot Touch)**
- All env var schemas (JWT_SECRET, CORS_ORIGIN, SUPABASE vars, Stripe keys, etc.)
- API endpoint contracts (no breaking changes)
- Supabase RLS policies
- Terraform environment names (dev/prod)
- Deployment workflows (6-phase gated)

---

## 7. Recommended Execution Order

```
PHASE 0 (BLOCKER FIX - BLOCKING DEPENDENCY)
├── FIX PROD ENV CONFIG (Create real tfvars/backend.hcl files)
└── ADD ADMIN PAGE TESTS (Wiring fix for CI validation)

PHASE 1 (LOW-RISK IMMEDIATE WINS)
├── WIRE SHARED PACKAGES (@mct/ui, @mct/config in tsconfig.json)
└── SIMPLIFY ROOT SCRIPTS (Copy Chat patterns, keep MCT additions)

PHASE 2 (MEDIUM-RISK CONVERGENCE)
├── REFACTOR TESTING SETUP (Mock builder utilities)
└── CONSOLIDATE MIGRATIONS (Date-based naming, preserve content)

PHASE 3 (OPTIONAL STRATEGIC)
├── ALIGN ROUTING (only if clear benefit)
└── SANITIZE TYPESCRIPT (gradual :any removal)
```

**Critical Path:** Phase 1 fixes (env config + admin tests) must complete before Phase 2. Production cannot be aligned until these blocks are resolved.

---

## 8. Minimum Validation Gates

### **GATE 1: Infrastructure Ready (After Phase 1 Fix)**
```
- terraform validate passes in CI
- env/prod.tfvars + env/dev.tfvars exist
- admin page test coverage > 50%
- lint/typecheck CI passes for all apps
```

### **GATE 2: Security & Stability (After Phase 2)**
```
- Shared packages wired and typecheck passes
- Testing setup migrated without breaking existing tests
- Migration naming works with rollback capability
- Root scripts functional across all environments
```

### **GATE 3: Strategic Improvements (After Gate 2)**
```
- Route testing passes for admin/portal/public access
- TypeScript sanitization passes all tests
- Migration rollback processes verified
- Manual QA completes for user-facing changes
```