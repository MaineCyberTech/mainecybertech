# Breaking Changes & Upgrade Manifest

> Standing manifest of the behavior-affecting changes in the current migration
> window on `develop`. Per-release detail still belongs in the release notes cut
> from [`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)
> — fill its **Breaking Changes** and **Migrations** sections with the release's
> filenames; this document is the running summary behind them.
>
> Current window: migrations `5302420`–`5302460` (last reviewed 2026-10-14).
> The historical log stays in [`CHANGELOG.md`](../CHANGELOG.md).

## How upgrades are applied

- Migrations run in filename order via
  [`.github/workflows/supabase-migrations.yml`](../.github/workflows/supabase-migrations.yml)
  on pushes to `develop`/`main` touching `supabase/**` (`supabase db push
  --include-all`), serialized per branch. The prod deploy's `migrate-gate`
  calls the same workflow; migrations are never pushed from a laptop.
- There are **no down-migrations**. Rollback is a reverse migration, PITR, or a
  backup restore — see [`ROLLBACK_PROCEDURES.md`](ROLLBACK_PROCEDURES.md) §3 and
  the bad-migration recovery in
  [`SUPABASE_MIGRATION_WORKFLOW.md`](SUPABASE_MIGRATION_WORKFLOW.md).
- The API writes with the service role; RLS policies are the backstop for
  direct PostgREST/Storage access. Rows below marked **direct clients** only
  affect callers that reach PostgREST or Storage with a user JWT or the anon
  key — the API's own paths are unchanged unless stated.

## Breaking / behavior changes

| Migration(s) | Change | Who is affected |
| --- | --- | --- |
| `5302420`, `5302428` | `client_portal_entitlements` insert/update RLS is now platform-admin only (`is_super_admin()` or `user_has_role(org, {admin,super_admin})`); `5302428` drops `client_admin` and adds a `with check` so a row cannot move across organizations. The approved-membership predicate is restored, so pending/suspended members lose access. | Direct clients: `client_admin` PostgREST writes now fail. The API path (service role, `requireAdmin`) is unchanged. |
| `5302432` | `deleted_at`/`deleted_by` are dropped from `tickets`, `projects` and `documents`. The columns were never written or read; hard delete is the product decision. | Schema-breaking for anything that read those columns. No data is lost (all values were NULL). |
| `5302434` | `anon` loses the blanket DML grant and the matching default privileges. The explicit allowlist is INSERT on `public_interactions`, `store_analytics_events`, `store_quotes` and SELECT on `store_categories`, `store_products`, `store_promotions`, `store_campaigns`. | Direct clients: anonymous PostgREST access outside the allowlist now fails. The API authenticates as service role, so public endpoints are unaffected. |
| `5302435` | `approve_project_task` / `add_project_task_comment` reject a caller-supplied user id that is not the caller's own when `auth.uid()` is set. | Direct clients: forged RPC calls fail. Service-role callers (the API) are unchanged. |
| `5302436` | Platform-admin DELETE gates on `knowledge_base_articles`, `hardware_staging_checks`, `device_profiles`, `time_entries` and `backup_status` use the full platform-admin key set via `user_has_role()`, matching `PLATFORM_ADMIN_KEYS`. | MSP platform-admin roles can delete again (previously only `admin`/`super_admin`, or `admin` alone, passed). |
| `5302437` | A `BEFORE UPDATE` trigger rejects changes to `profiles.is_super_admin` from `authenticated`/`anon` JWTs. | Direct clients: the column is no longer user-writable. Service-role writes and direct SQL are unaffected. |
| `5302439` | The `documents` bucket drops its authenticated INSERT/UPDATE policies; object writes must go through the API, which validates content and uploads as service role. `file_size_limit` is 25 MiB. | Direct clients: direct-to-storage writes now fail. SELECT/DELETE policies and the org-prefix check are unchanged. |
| `5302430` | `file_request_uploads` records accepted intake files, and the writer stores them under `<org_uuid>/requests/<token>/...` so cleanup and download can reconcile them. | Objects written under the old `uploads/requests/...` path are treated as orphans by the 6-hourly cleanup. No authenticated insert policy (service role only). |
| `5302442` | `audit_log_archive` (append-only, no FK to `organizations`) plus `archive_audit_logs()` / `archive_org_audit_logs()`, executable only by `service_role`. Retention and org deletion archive rows before deleting them. | Behavior change: purged/org-deleted audit rows now land in `audit_log_archive` instead of being destroyed. |
| `5302443` | The existing `set_updated_at` trigger is installed on every public base table that has an `updated_at` column and no trigger yet (core tables and `webhook_endpoints`/`project_updates` are skipped). | Behavior change: `updated_at` now moves on module-table updates (previously frozen at insert time). |
| `5302446` | `store_analytics_events.ip_address` / `user_agent` are dropped; the tracking route stops writing them. | Schema-breaking for anything that read those columns; plaintext PII already stored is removed. Remaining event rows age out via the worker `retention` task (90 days). |
| `5302447` | `document_versions` UPDATE requires approved membership plus `documents:edit` (or platform super admin), derived from the parent document; the raw status-unfiltered predicate is gone. | Direct clients: pending/suspended members and members without `documents:edit` can no longer update version rows. The API (service role) is unchanged. |
| `5302448` | `store_quotes` INSERT is tenant-scoped: `anon` may only insert global leads (`organization_id IS NULL`); authenticated users a global lead or a quote for an organization they are an approved member of. | Direct clients: tagging a quote with an arbitrary `organization_id` (cross-tenant injection) now fails. The API quote path is unchanged. |
| `5302449` | Consent is recorded server-side: `public_interactions.consent_version`, `store_quotes.consent_at`/`consent_version`, and the same on `store_quote_requests`; a submission without explicit consent stores no PII (default-deny). | Behavior change: quote/contact submissions must send the consent flag; rows without it are treated as no-consent. |
| `5302451` | A `BEFORE DELETE` trigger on `audit_logs` archives an organization's rows before the FK cascade can run and fails the delete if any row remains. | Behavior change: organization deletion now preserves audit history on every path, including ones that bypass the API/worker archive calls. |
| `5302457` | CHECK constraints (added `NOT VALID`, enforced for new writes) on the prioritised status/workflow text columns. | Direct clients: arbitrary status strings now fail at the database. Legacy rows are not scanned until an operator validates the constraints. |
| `5302458` | `anon` loses the INSERT grant and the `anon_insert` policy on `store_analytics_events`; analytics writes stay on the API path (`POST /api/v1/analytics/track`, validation + rate limits + retention). | Direct clients: anonymous PostgREST inserts now fail. |
| `5302460` | `portal_module_settings` is dropped (orphaned table — nothing read or wrote it; per-org module enablement is derived from the plan plus `client_portal_entitlements`). | Schema-breaking for anything that read the table; the demo seed inserts were removed in the same change. |

### Application behavior in the same window

- **Entitlements are enforced server-side** (`BILL-P1-001`):
  `apps/api/src/middleware/entitlement.ts` (`requireEntitlement`,
  `requireActiveSubscription`) resolves the same entitlement set as the
  bootstrap and rejects a gated module without an active entitlement with
  `402 PAYMENT_REQUIRED` (`lib/entitlements.ts` `GATED_MODULES`). Platform
  admins bypass the check, and a failed entitlement lookup fails open, so the
  RLS rows above remain the backstop for direct writes.
- **Retention is bounded and fail-visible** (`DATA-P1-002`):
  `apps/worker/src/tasks/retention.ts` deletes in bounded batches, reports
  partial failures instead of success, and leaves a backlog for the next run;
  audit rows are archived first (`5302442`).
- **Analytics consent is default-deny** (`PRIV-P2-001`, `AN-P2-005`):
  `public_interactions.consent_at` records consent and visitor IP/UA are no
  longer captured before opt-in; `5302449` extends the same default-deny record
  (`consent_version` / `consent_at`) to the store quote path (`store_quotes`,
  `store_quote_requests`).

## Additive changes (no upgrade action)

- `5302421` `store_proposal_drafts.proposal_id` link; `5302422`
  `store_campaigns` table; `5302423` `store:view` granted to client roles;
  `5302424` `manage` actions and `5302426` `status:*` actions added to the
  permission catalog; `5302425` `public_interactions.is_bot`.
- `5302427` `mfa_recovery_codes` (deny-all RLS, service role only); `5302431`
  `file_requests.slot_tokens` plus atomic `claim_file_request_slot()` /
  release functions; `5302433` the `avatars` bucket declared public with
  owner-scoped write policies.
- `5302438` `public_interactions.consent_at`; `5302440`
  `get_analytics_summary()` (service-role only); `5302441` webhook signing-secret
  rotation/expiry metadata (legacy plaintext secrets are re-encrypted on the
  next write); `5302444` subscription/invoice/payment lifecycle fields;
  `5302445` `task_dead_letters` (deny-all, worker/service role only).
- `5302450` `platform_backup_heartbeats` (platform backup heartbeat; platform
  admins read, `db-backup.yml` upserts via `scripts/record-backup-heartbeat.sh`);
  `5302452` `webhook_dead_letters` DELETE policy scoped to `webhooks:manage`
  (dead-letter retry/dismiss through the RLS-bound client now deletes the row);
  `5302453` `push_subscriptions` plus the `push` notification-preference value;
  `5302454` retention indexes for the webhook delivery/dead-letter purges;
  `5302455` `project_tasks.m365_event_id` (idempotent M365 calendar sync);
  `5302456` search prefix/trigram/tsvector indexes; `5302459`
  permission-catalog completeness for legacy RLS predicates (no live policy
  changes — the referenced tables are already dropped).

## After upgrading

- Confirm the migration job is green and the deploy's `migrate-gate` passed.
- If legacy rows hold status values outside the `5302457` CHECK vocabulary,
  backfill them and `alter table ... validate constraint <name>` to complete the
  guarantee (the constraints are `NOT VALID` until then).
- Confirm the RLS hygiene guard (`node scripts/verify-rls.mjs`) and the docs
  counts job are green in the deploy's `validate` gate.
- Re-run the release-notes checklist
  ([`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)):
  record the applied filenames, the rollback path, and any operator action.
