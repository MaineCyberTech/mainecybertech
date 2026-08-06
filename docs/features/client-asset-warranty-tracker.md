# Client Asset Warranty Tracker

## Purpose

Asset register for each client organization with warranty and lifecycle management: purchase dates, warranty expiry, recommended replacement dates, lifecycle scores, vendor support status, and assignments. Detail views aggregate comments and timeline events for each asset.

Primary users: MSP asset manager, technician, client admin

Business impact: High

Category: operations

## Permissions

Permission module key: `assets` (view / create / edit / delete)

| Action            | Roles                          |
| ----------------- | ------------------------------ |
| List/view assets  | All authenticated org members  |
| Create asset      | admin, super_admin, technician |
| Update asset      | admin, super_admin, technician |
| Delete asset      | admin, super_admin             |
| Comment on asset  | All authenticated org members  |
| Export asset list | admin, super_admin             |

## Routes

### Portal Routes

| Route                | Description                            |
| -------------------- | -------------------------------------- |
| `GET /portal/assets` | Asset inventory with warranty tracking |

### Admin Routes

| Route               | Description                     |
| ------------------- | ------------------------------- |
| `GET /admin/assets` | Admin asset register management |

### API Routes

| Method | Endpoint                      | Description                                                                 |
| ------ | ----------------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/v1/assets/export`       | CSV/JSON export (10,000 row cap)                                            |
| GET    | `/api/v1/assets`              | List assets (filters: status, asset_type, search, warranty_expiring_before) |
| GET    | `/api/v1/assets/stats`        | Aggregates: byStatus, byType, expiringWarranty                              |
| GET    | `/api/v1/assets/:id`          | Get asset + comments + timeline                                             |
| POST   | `/api/v1/assets`              | Create asset (sets owner/created_by to caller)                              |
| PATCH  | `/api/v1/assets/:id`          | Update asset (If-Match optimistic locking)                                  |
| DELETE | `/api/v1/assets/:id`          | Delete asset                                                                |
| GET    | `/api/v1/assets/:id/comments` | List asset comments                                                         |
| POST   | `/api/v1/assets/:id/comments` | Add asset comment                                                           |
| GET    | `/api/v1/assets/:id/timeline` | List asset timeline events                                                  |

## Data Model

### assets

| Column                  | Type          | Constraints                      | Description                            |
| ----------------------- | ------------- | -------------------------------- | -------------------------------------- |
| id                      | uuid          | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id         | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                         |
| name                    | text          | NOT NULL                         | Asset name                             |
| asset_type              | text          | NOT NULL, default 'hardware'     | hardware / software / license / other  |
| make                    | text          |                                  | Manufacturer                           |
| model                   | text          |                                  | Model                                  |
| serial_number           | text          |                                  | Serial number                          |
| asset_tag               | text          |                                  | Asset tag (indexed)                    |
| qr_label                | text          |                                  | QR label value                         |
| status                  | text          | NOT NULL, default 'active'       | active / retired / pending / in_repair |
| visibility              | text          | NOT NULL, default 'internal'     | internal / client_visible              |
| location                | text          |                                  | Physical location                      |
| site                    | text          |                                  | Site                                   |
| purchase_date           | date          |                                  | Purchase date                          |
| purchase_price          | numeric(12,2) |                                  | Purchase price                         |
| warranty_expires        | date          |                                  | Warranty expiry (indexed)              |
| replacement_recommended | date          |                                  | Recommended replacement date           |
| lifecycle_score         | integer       | NOT NULL, default 100            | Lifecycle health score                 |
| owner_user_id           | uuid          | FK → auth.users(id)              | Asset owner                            |
| assigned_to             | uuid          | FK → auth.users(id)              | Assigned user                          |
| maintenance_notes       | text          |                                  | Maintenance history/notes              |
| supported_until         | date          |                                  | Vendor support end date                |
| vendor_support_status   | text          | NOT NULL, default 'supported'    | supported / eol / unknown              |
| ip_address              | text          |                                  | Network address                        |
| mac_address             | text          |                                  | MAC address                            |
| operating_system        | text          |                                  | OS                                     |
| contract_reference      | text          |                                  | Procurement contract reference         |
| created_by              | uuid          | FK → auth.users(id)              | Creator                                |
| updated_by              | uuid          | FK → auth.users(id)              | Last updater                           |
| metadata                | jsonb         | NOT NULL, default '{}'           | Extensible metadata                    |
| version                 | integer       | NOT NULL, default 1              | Optimistic locking                     |
| created_at              | timestamptz   | NOT NULL, default now()          | Creation timestamp                     |
| updated_at              | timestamptz   | NOT NULL, default now()          | Last update timestamp                  |

## Workflows

### Asset Intake

1. Record `name`, `asset_type`, make/model, `serial_number`, `asset_tag`
2. Capture purchase info (`purchase_date`, `purchase_price`) and `warranty_expires`
3. Assign `owner_user_id` / `assigned_to`; set `lifecycle_score`
4. Creator becomes `created_by` and `owner_user_id` by default

### Warranty & Replacement Planning

- `GET /api/v1/assets/stats` reports `expiringWarranty` (warranty expiring within 90 days)
- `GET /api/v1/assets?warranty_expiring_before=YYYY-MM-DD` lists assets by expiry
- `replacement_recommended` and `vendor_support_status` drive refresh cycles

### Optimistic Locking

- PATCH requires `If-Match` with the current `version`
- `version` increments on every successful update
- Concurrent edits return 409 `VERSION_CONFLICT`

### Comments & Timeline

- Asset detail (`GET /:id`) embeds `module_comments` and `module_timeline_events`
- New comments POST to `/:id/comments`; timeline events added on create

## AI Review Rules

- AI may draft asset lifecycle recommendations from warranty/support data
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before applying

## Troubleshooting

| Issue                    | Resolution                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| PATCH returns 409        | Concurrent modification; refresh asset (new `version`) and retry     |
| List filter by warranty  | Use `warranty_expiring_before=YYYY-MM-DD` (excludes null warranties) |
| Export empty             | Verify org has assets; admin/super_admin role required               |
| List empty for valid org | Verify `organization_id` matches active org; check RLS               |
| Delete 403               | Only admin/super_admin role members may delete assets                |

## Release Checklist

- [ ] Migration `5302061_asset_tracker.sql` applied (assets + RLS + indexes)
- [ ] Permission keys `assets:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/assets.ts` (CRUD + stats + export + comments + timeline)
- [ ] Validators in `apps/api/src/validators/assets.ts`
- [ ] Optimistic locking middleware `requireIfMatch`/`checkVersionMatch` wired
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/assets/` renders
- [ ] Admin page `apps/web/app/(admin)/admin/assets/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/assets.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/client-asset-warranty-tracker.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
