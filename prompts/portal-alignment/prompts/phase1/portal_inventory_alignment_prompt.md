# PHASE 1 — FULL INVENTORY + ALIGNMENT MAPPING

## Objective

Build a complete system map of the monorepo: frontend, backend, database schemas, infrastructure, and documentation.

## Scope

IN: all files under apps/, packages/, supabase/, infra/, docs/, .github/
OUT: node_modules/, .git/

## Scan Requirements

- **Frontend:** every page.tsx, component, layout, action, and API call in apps/web/
- **Backend:** every route handler, middleware, service, and utility in apps/api/
- **Worker:** every task handler, consumer, and health server in apps/worker/
- **Database:** every migration file, seed file, and Supabase config
- **Infrastructure:** all Terraform, Docker, and CI/CD workflow files
- **Documentation:** every .md file with meaningful content (not stubs)
- **Shared packages:** @mct/ui, @mct/config, packages/sdk

## Output Format (`engine/outputs/inventory.json`)

```json
{
  "version": "3.0",
  "scanned_at": "<ISO8601 timestamp>",
  "summary": {
    "total_files": 1419,
    "total_lines": 97352,
    "apps": {
      "api": { "files": 0, "routes": 0, "middleware": 0, "tests": 0, "coverage": 0 },
      "web": { "files": 0, "pages": 0, "components": 0, "actions": 0, "tests": 0, "coverage": 0 },
      "worker": { "files": 0, "tasks": 0, "handlers": 0, "tests": 0, "coverage": 0 }
    },
    "packages": {
      "sdk": { "files": 0, "methods": 0, "types": 0, "tests": 0 },
      "ui": { "files": 0 },
      "config": { "files": 0 }
    },
    "database": { "migrations": 0, "seeds": 0, "tables_created": 0 },
    "infrastructure": { "terraform_files": 0, "docker_files": 0, "workflows": 0 },
    "docs": 0,
    "tests_total": 0,
    "eslint_errors": 0,
    "typecheck_errors": 0
  },
  "findings": [
    {
      "severity": "P0|P1|P2|P3",
      "phase": 1,
      "category": "inventory",
      "file": "path",
      "issue": "",
      "impact": "",
      "fix": ""
    }
  ]
}
```

## Severity Assignment for Phase 1

- P0: Missing file that causes build/runtime failure, broken import chain
- P1: Orphaned file no longer imported but still referenced in docs/config
- P2: Stale file, duplicate, or file that should be archived
- P3: File without owner category, missing header comment

---

automation:
checks: - id: PINV-001
desc: "Count all page.tsx files in apps/web/"
glob: "apps/web/app/**/page.tsx"
expect: "return count and paths" - id: PINV-002
desc: "Count all route files in apps/api/src/routes/"
glob: "apps/api/src/routes/_.ts"
expect: "return count and paths" - id: PINV-003
desc: "Count all migration files"
glob: "supabase/migrations/_.sql"
expect: "return count and paths" - id: PINV-004
desc: "Count all test files"
glob: "apps/\*/**tests**/**/\*.test.{ts,tsx}"
expect: "return count and distribution by app"
