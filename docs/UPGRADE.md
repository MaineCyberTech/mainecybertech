# Breaking Changes & Upgrade Manifest

> Standing manifest of the behavior-affecting changes in the current migration
> window on `develop`. Per-release detail still belongs in the release notes cut
> from [`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)
> — fill its **Breaking Changes** and **Migrations** sections with the release's
> filenames; this document is the running summary behind them.
>
> Current window: migrations `5302420`–`5302446` (last reviewed 2026-10-11).
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
  longer captured before opt-in.

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

## After upgrading

- Confirm the migration job is green and the deploy's `migrate-gate` passed.
- Confirm the RLS hygiene guard (`node scripts/verify-rls.mjs`) and the docs
  counts job are green in the deploy's `validate` gate.
- Re-run the release-notes checklist
  ([`templates/RELEASE_NOTES_TEMPLATE.md`](../templates/RELEASE_NOTES_TEMPLATE.md)):
  record the applied filenames, the rollback path, and any operator action.
