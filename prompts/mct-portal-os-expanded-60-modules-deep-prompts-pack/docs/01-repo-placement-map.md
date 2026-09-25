# Repo Placement Map

| Layer              | Standard path                                         |
| ------------------ | ----------------------------------------------------- |
| API route          | `apps/api/src/routes/<module>.ts`                     |
| API validator      | `apps/api/src/validators/<module>.ts`                 |
| API service        | `apps/api/src/services/<module>.ts`                   |
| API registration   | `apps/api/src/app.ts`                                 |
| API tests          | `apps/api/src/__tests__/<module>.test.ts`             |
| SDK module         | `packages/sdk/src/<module>.ts`                        |
| SDK export         | `packages/sdk/src/index.ts`                           |
| Portal list page   | `apps/web/app/(portal)/portal/<module>/page.tsx`      |
| Portal detail page | `apps/web/app/(portal)/portal/<module>/[id]/page.tsx` |
| Portal components  | `apps/web/components/portal/<ModuleName>/`            |
| Admin components   | `apps/web/components/admin/<ModuleName>/`             |
| E2E test           | `apps/web/e2e/portal/<module>.spec.ts`                |
| Worker task        | `apps/worker/src/tasks/<module>.ts`                   |
| Migration          | `supabase/migrations/<timestamp>_<module>.sql`        |
| Feature doc        | `docs/features/<module>.md`                           |
| Runbook            | `docs/runbooks/<module>.md`                           |
