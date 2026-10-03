# PHASE 4 — FRONTEND SYSTEM ALIGNMENT

## Objective

Evaluate frontend consistency: information architecture, component reuse, UX patterns, error handling, and metadata coverage.

## Scope

IN: apps/web/app/ (all page.tsx, layout.tsx, loading.tsx, error.tsx),
apps/web/components/ (all .tsx)
OUT: third-party components, static assets

## Evaluate

1. **IA consistency** — route groups are logically organized; naming follows conventions
2. **Component reuse** — duplicate component patterns that should be shared; components in wrong directories
3. **UX patterns** — every route group has loading.tsx, error.tsx (with retry), and metadata title
4. **Error handling** — every catch block in client components shows user-visible feedback, not just console.error
5. **Server action patterns** — actions return `{ ok, error }`; caller checks ok before proceeding
6. **SDK vs direct fetch** — all API calls go through SDK or client-api.ts, not raw fetch

## Output Format (`engine/outputs/frontend_alignment.json`)

```json
[
  {
    "severity": "P0|P1|P2|P3",
    "phase": 4,
    "category": "frontend",
    "file": "apps/web/app/(group)/page/page.tsx",
    "issue": "Missing loading.tsx in (admin) route group",
    "impact": "No loading state during data fetch — blank screen",
    "fix": "Create apps/web/app/(admin)/loading.tsx with skeleton"
  }
]
```

## Severity Definitions for Phase 4

- P0: Route group missing error.tsx entirely — unhandled errors crash the group
- P1: Missing loading.tsx in data-heavy group; no metadata title on key page
- P2: Duplicate component that should be shared; component in wrong directory
- P3: Missing skeleton/loading detail; console.error not routed to Sentry

---

automation:
checks: - id: FE-001
desc: "Each route group has error.tsx"
glob: "apps/web/app/**/error.tsx"
expect: "check (public), (portal), (admin), and root all have error.tsx with retry" - id: FE-002
desc: "Each route group has loading.tsx"
glob: "apps/web/app/**/loading.tsx"
expect: "check (admin) and (portal) have loading.tsx" - id: FE-003
desc: "Every page.tsx has metadata export"
grep: "export const metadata|export async function generateMetadata"
path: "apps/web/app/"
expect: "check each page.tsx has metadata — count coverage" - id: FE-004
desc: "No raw fetch in client components"
grep: "fetch\("
path: "apps/web/components/"
include: "\*.tsx"
expect: "zero raw fetch calls outside of lib/client-api.ts or lib/api.ts"
