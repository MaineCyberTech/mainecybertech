# API / Web / SDK / Worker Patterns

## API routes

Recommended standard shape:

```text
GET    /api/v1/<module>?organizationId=...
GET    /api/v1/<module>/:id
POST   /api/v1/<module>
PATCH  /api/v1/<module>/:id
DELETE /api/v1/<module>/:id
POST   /api/v1/<module>/:id/approve
POST   /api/v1/<module>/:id/recalculate
GET    /api/v1/<module>/export.csv
```

## API expectations

- `requireAuth` on all non-public routes.
- `requireOrgAccess` on organization-scoped routes.
- Zod validation for query/body/params.
- Service layer for calculations, external checks, imports, and AI orchestration.
- Audit logging on create/update/delete/approve/export/publish.
- Cache invalidation if existing adjacent routes use cache.

## Web expectations

- Portal route for client/internal use.
- Admin route only if global settings or cross-tenant admin controls are needed.
- Component folder per module.
- Empty/loading/error/success states.
- Search/filter/sort/export where relevant.
- Client-visible copy should be plain-English and business-oriented.

## Worker expectations

Use workers for scheduled checks, external API calls, recalculations, report generation, notification digests, and long-running imports.
