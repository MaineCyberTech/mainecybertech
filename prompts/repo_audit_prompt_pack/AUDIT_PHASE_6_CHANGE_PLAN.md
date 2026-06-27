# Phase 6 — File-by-File Change Plan

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat-platform)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT Portal)

---

## PHASE 0 — BLOCKER FIXES (IMMEDIATE)

### **WIN 0.1: Fix Production Environment Config**

**Files:** 
- `infra/terraform/env/prod.tfvars` (CREATE from `.example`)
- `infra/terraform/env/dev.tfvars` (CREATE from `.example`)
- `infra/terraform/env/backend.prod.hcl` (CREATE from `.example`)
- `infra/terraform/env/backend.dev.hcl` (CREATE from `.example`)

| Change | Description | File |
|--------|------------|------|
| Populate prod DO token | `DO_TOKEN="..."` | `prod.tfvars` |
| Set prod region | `DO_REGION="nyc3"` | `prod.tfvars` |
| Set prod droplet size | `DO_SIZE="s-4vcpu-8gb"` | `prod.tfvars` |
| Set prod DNS zone | `CLOUDFLARE_PRODUCTION_ZONE="mainecybertech.com"` | `prod.tfvars` |
| Set dev DNS zone | `CLOUDFLARE_DEV_ZONE="mainecybertech.us"` | `dev.tfvars` |
| Set S3 backend bucket | `bucket="mct-terraform-prod"` | `backend.prod.hcl` |
| Set S3 backend bucket (dev) | `bucket="mct-terraform-dev"` | `backend.dev.hcl` |

**Why:** Production deploys blocked without real terraform configs

**Inspired by:** Chat repo has real config files (not just `.example`)

**Validation:** `terraform validate` passes

**Rollback:** git revert + restore `.example` files

---

### **WIN 0.2: Add Admin Page Tests**

**Files (4 new test files):**
- `apps/web/__tests__/app/(admin)/admin/webhooks/page.test.tsx` — 32 tests
- `apps/web/__tests__/app/(admin)/admin/bulk-invite/page.test.tsx` — 28 tests
- `apps/web/__tests__/app/(admin)/admin/health/page.test.tsx` — 16 tests
- `apps/web/__tests__/app/(admin)/admin/organizations/[orgId]/billing/page.test.tsx` — 64 tests

**Test patterns to follow** (from existing MCT tests):
```typescript
// Mock SDK client (from existing sdk.test.ts)
jest.mock("@mct/sdk", () => ({
  MCTClient: { create: jest.fn() }
}));

// AdminPageShell test pattern (from AdminPageShell.test.tsx)
import { AdminPageShell } from "@/components/admin/AdminPageShell";
```

**Why:** Zero coverage on 4 admin pages — high regression risk

**Inspired by:** Chat's test structure + MCT's own existing test patterns

**Validation:** `pnpm test:web — --coverage` → verify admin coverage > 50%

**Rollback:** Remove new test files (no functional impact)

---

### **WIN 0.3: Implement JSM/Teams Webhook in `public.ts`**

**File:** `apps/api/src/routes/public.ts`

**Changes needed:**
```typescript
// Current: placeholder success response
router.post("/api/v1/public/init", async (req, res) => {
  // TODO: Teams webhook call
  // TODO: Create ticket via JSM
  return res.json({ success: true, ticketId: "TODO" });
});

// Target: full implementation with:
// - Zod validation for input
// - Teams webhook call via httpClient
// - JSM ticket creation via API
// - Proper error handling + logging
```

**Why:** Marketing contact form broken end-to-end

**Inspired by:** Chat's webhook management pattern

**Validation:** Manual QA on marketing contact form + E2E test

**Rollback:** Revert to previous placeholder implementation

---

## PHASE 1 — LOW-RISK ALIGNMENTS

### **SIM 1.1: Wire Shared Packages**

**File:** `apps/api/tsconfig.json`
```json
{
  "extends": "@mct/config/tsconfig.base.json",
  "references": [
    { "path": "./packages/ui" },
    { "path": "./packages/sdk" },
    { "path": "./packages/config" }
  ]
}
```

**File:** `apps/web/tsconfig.json` (same pattern)
**File:** `apps/worker/tsconfig.json` (same pattern)

**Why:** Type safety and linting consistency across workspace

**Inspired by:** Chat's project references in tsconfig

**Validation:** `pnpm typecheck` passes all apps

**Rollback:** Remove `references` blocks

---

### **SIM 1.2: Simplify Root package.json Scripts**

**File:** `package.json` (root)

**Current (complex):** ~15 scripts including duplicate patterns
**Target (simplified):**
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "turbo clean",
    "ci": "pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build",
    "prepare": "husky"
  }
}
```

**Why:** Cleaner DX, easier onboarding

**Inspired by:** Chat's simple script structure

**Validation:** All existing workflows still work (turbo handles per-app scripts)

**Rollback:** Restore original scripts

---

## PHASE 2 — MEDIUM-RISK CONVERGENCE

### **CONVERGE 2.1: Testing Setup Refactoring**

**Files to create:**
- `tests/setup/jest.setup.ts` (shared mock builder utilities)
- `tests/config/jest.config.base.ts` (shared Jest configuration)

**Mock builder pattern (adapted from Chat's vitest pattern):**
```typescript
// tests/setup/jest.setup.ts
export function createMockBuilder() {
  return {
    filter: () => createMockBuilder(),
    maybeSingle: (val: any) => createMockBuilder(),
    then: (result: any) => result,
    rpc: () => createMockBuilder(),
    upsert: () => createMockBuilder(),
  };
}
```

**Why:** More declarative test patterns, reduces boilerplate

**Inspired by:** Chat's testing setup pattern

**Validation:** All 769 existing tests still pass

**Rollback:** Revert shared setup files

---

### **CONVERGE 2.2: Date-Based Migration Naming**

**File:** `supabase/migrations/` (new migrations only)

**Current:** `5302038_*.sql` (sequential numbering)
**Target:** `20260626_*.sql` (date-based for new migrations)

**Why:** Clearer migration history and rollback paths

**Inspired by:** Chat's `20260625*` migration naming

**Validation:** `supabase db push` and `supabase db diff` work correctly

**Rollback:** Rename new migrations back to sequential format

---

## EXECUTION ORDER SUMMARY

| Order | Change | Risk | Effort | Impact |
|-------|--------|------|--------|--------|
| 1 | Create prod/dev tfvars files | Zero | Low | **CRITICAL** |
| 2 | Add admin page tests | Low | Medium | High |
| 3 | Implement JSM webhook | Low | Medium | High |
| 4 | Wire shared packages | Low | Low | Medium |
| 5 | Simplify root scripts | Zero | Low | Medium |
| 6 | Refactor test setup | Medium | Medium | Medium |
| 7 | Date-based migration naming | Low | Low | Low |
| 8 | T Sanitization (optional) | Medium | High | Low |