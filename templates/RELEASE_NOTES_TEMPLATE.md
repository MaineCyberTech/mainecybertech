# Release notes — {{version}} ({{sha}})

<!--
  Copy this file to `release_notes_draft.md`, fill every section, then use it
  as the GitHub Release body / deployment announcement. Sections marked "none"
  are explicit, not omitted. See docs/RELEASING.md for the release process.
-->

**Release:** `{{version}}` (`{{sha}}`, {{date}})
**Images:** `ghcr.io/mainecybertech/mainecybertech/mct-{api,worker,web}:{{sha}}`
**Environments:** dev / prod

## Summary

One paragraph: what this release is and who it affects.

## Added

-

## Changed

-

## Fixed

-

## Security

-

## Breaking Changes

Behavior-affecting changes only: RLS/entitlement policies, enum values, column
nullability, or API contract changes. Write `none` when there are none.

-

## Migrations

- Applied in order by `supabase-migrations.yml`:
  - `5302NNN_name.sql` — one line on what it changes
- Rollback: no down-migrations; restore from backup
  (`docs/ROLLBACK_PROCEDURES.md`). Schema-compatible with the previous
  release? yes/no.

## Operator Actions

- [ ] Secrets/variables to set before deploy:
- [ ] Manual steps after deploy:

## Known Issues

- Link the `AGENTS.md` Known Debt entries that affect this release.

## Verification

- [ ] `deploy-do` green; containers healthy (`docker ps`)
- [ ] Smoke checks: app login, API `/health`, storefront, admin dashboard
- [ ] Post-deploy alerts quiet for 30 minutes
