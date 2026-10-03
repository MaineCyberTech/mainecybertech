# Remediation Plan

| Priority | Domain    | File                         | Issue                    | Action                      | Effort |
| -------- | --------- | ---------------------------- | ------------------------ | --------------------------- | ------ |
| P1       | security  | apps/api/src/routes/users.ts | Missing requireOrgAccess | Add org membership check    | medium |
| P2       | data      | supabase/migrations/         | Dead schema tables       | Remove or add API endpoints | medium |
| P3       | evolution | apps/web/app/(public)/       | Missing loading.tsx      | Add skeleton component      | small  |

## Legend

- **P0**: Blocking — must fix before next deploy
- **P1**: High — fix within current sprint
- **P2**: Medium — schedule within 2 sprints
- **P3**: Low — backlog / tech debt

_Schema: schemas/findings_schema.json_
