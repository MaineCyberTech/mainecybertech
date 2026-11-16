# Portal → Alga PSA read-only data export

Status: **read-only audit/export tooling.** This runbook and
`supabase/scripts/portal_psa_export.sql` do not write to Supabase or Alga PSA.

Related:

- `albatross/docs/adr/0001-alga-psa-system-of-record.md` — PSA is the system of
  record for service delivery.
- `albatross/docs/analysis/PORTAL-PSA-ALIGNMENT-20261114.md` — portal/PSA
  entity alignment and ticket cutover.
- `albatross/docs/analysis/PORTAL-DATA-TO-PSA-20261116.md` — full data
  inventory, mapping, exclusions and reconciliation sequence.

## What the export covers

| Output file | Source | Import posture |
|---|---|---|
| `organizations.csv`, `organization_domains.csv` | `organizations`, `organization_domains` | Crosswalk to PSA `clients`; no auto-create |
| `profiles.csv`, `memberships.csv` | `profiles`, `memberships`, `roles` | Staff → PSA `users`; client users → `contacts`; consent review |
| `billing_customers.csv`, `subscriptions.csv`, `invoices.csv`, `payments.csv` | Stripe mirror | Read-only reference; no Stripe IDs/payment data; PSA CE uses manual invoices/payments |
| `service_catalog.csv` | `service_catalog` | Transform to PSA `service_catalog` + `service_prices` |
| `vendor_contracts.csv` | `vendor_contracts` | Reference only; not a PSA client contract |
| `procurement_quotes.csv` | `procurement_quotes` | Reference only; vendor purchasing is not a client quote |
| `proposals.csv`, `proposal_phases.csv`, `proposal_line_items.csv` | proposal builder | Transform to PSA `quotes` / `quote_items` after approval |
| `store_products.csv`, `store_quotes_metadata.csv` | public storefront | Product/lead reference only; no lead PII |
| `projects.csv`, `project_phases.csv`, `project_milestones.csv`, `project_tasks.csv`, `project_dependencies.csv` | project tracker | Transform to PSA projects/phases/tasks |
| `time_entries.csv` | portal time entries | Transform to PSA `time_entries`; portal has no timesheets |
| `documents.csv`, `document_versions.csv`, `document_shares.csv` | document metadata | Link/metadata only; **no storage bytes or share tokens** |
| `knowledge_base_articles.csv`, `knowledge_articles_legacy.csv`, `kb_article_generations.csv` | two portal KB stores | Consolidate and transform to PSA `kb_articles` + a PSA document |
| `assets.csv` | asset register | Transform to PSA `assets` / `asset_type_registry`; reconcile with Level sync |
| `sla_logs.csv` | portal SLA logs | Reference/derived only; PSA SLA policy is authoritative |
| `satisfaction_pulses.csv`, `satisfaction_pulse_templates.csv`, `satisfaction_pulse_schedules.csv` | CSAT/NPS | Ticket-linked ratings may map to PSA `survey_responses`; feedback body omitted |
| `client_onboarding_command_center_records.csv`, `client_onboarding_checklist_items.csv`, `onboarding_clients.csv` | onboarding workspaces | M365/licence/onboarding fields; no credentials or scan output |
| `license_tracking.csv`, `license_allocations.csv`, `m365_hardening.csv` | licence/M365 modules | Reference; no first-class PSA M365 tenant/licence model |
| `public_interactions_metadata.csv` | marketing lead form | Metadata only; lead PII is consent-gated |
| `tickets_metadata.csv` | tickets | Counts/metadata only; use the PSA intake/backfill path for ticket bodies |
| `_demo_orgs.csv`, `_counts.csv` | manifests | Filter demo rows and record export counts |

## Read-only role

Use a dedicated PostgreSQL login, not the Supabase `service_role` key and not
the REST API. The role must be able to `CONNECT` and `SELECT`; it must not have
`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE` or `GRANT`.

For RLS-protected tables the role also needs to see every row. The simplest
PostgreSQL 14+ option is membership in the built-in `pg_read_all_data` role:

```sql
-- DBA-run, one time. Create the login without embedding a password in SQL;
-- set it through the approved secret store or psql \password.
create role portal_export login noinherit;
grant pg_read_all_data to portal_export;
grant connect on database :"dbname" to portal_export;
```

If the DBA will not grant `pg_read_all_data` (it also reads other schemas), use
a read replica or grant table-level `SELECT` plus `BYPASSRLS` on the export
role. Do not use a role that can write.

The script itself also runs `begin read only` and sets a read-only session
default as defense in depth.

## Run

```sh
mkdir -p portal-export

# Read the URL from the approved secret store; do not paste it into shell
# history, logs or the repo.
psql "$PORTAL_READONLY_DATABASE_URL" \
  --set ON_ERROR_STOP=1 \
  --file supabase/scripts/portal_psa_export.sql
```

The CSV files are written to `portal-export/` relative to the current working
directory. Verify `portal-export/_counts.csv` and `_demo_orgs.csv` before
sharing any file.

## Data handling

- `profiles.csv`, `memberships.csv`, `assets.csv`, `documents.csv`,
  KB files, satisfaction files and the onboarding files can contain personal or
  confidential data. Encrypt the output at rest, restrict it to the migration
  owner and delete it after reconciliation.
- Do not commit `portal-export/` and do not attach it to tickets or chat.
- The export intentionally omits:
  - all Stripe customer/subscription/invoice/payment identifiers and hosted
    invoice/PDF URLs;
  - `billing_customers.default_payment_method` and any card data;
  - `profiles.encrypted_pii`, password hashes, MFA recovery codes, API key
    hashes, webhook secrets, share tokens and file-request tokens;
  - `client_onboarding_command_center_records.access_credentials`,
    `network_scan_results`, security findings and contact PII;
  - document/KB storage bytes, signed URLs and share tokens;
  - ticket/comment bodies (handled by the reviewed PSA intake/backfill path);
  - lead names/emails/phones/messages in `public_interactions` and
    `store_quotes` (only presence/metadata is exported).

## Demo data

The repository seed is not live data. It creates five primary fictional
organizations plus two edge-status synthetic organizations, 22 demo tickets and
fixture rows across modules. Rows are flagged `is_demo` in the export when they
belong to a known demo organization, have `settings.seeded=true` or have
`metadata.seeded=true`. The guarded demo migrations
(`5302119`, `5302120`, `5302121`, `5302123`, `5302126`) only run when
`app.seed_demo='true'`; production must leave that unset/false.

Check before exporting:

```sql
select current_setting('app.seed_demo', true);
select count(*) from public.organizations where settings->>'seeded' = 'true';
```

## Verification

```sh
git diff --check
python3 scripts/check-portal-export-sql.py
```

The static check verifies that every `\copy` is a `SELECT`/`WITH` query, that no
write statements or forbidden secret columns are present, and that selected
column names exist in `packages/sdk/src/database.types.ts`. It does not connect
to a database.
