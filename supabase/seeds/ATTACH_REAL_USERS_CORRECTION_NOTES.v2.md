# attach_real_users Correction Notes (v2)

This corrected replacement file fixes the foreign-key error:

```text
ERROR: insert or update on table "profiles" violates foreign key constraint "profiles_default_organization_id_fkey"
DETAIL: Key (default_organization_id)=(11111111-1111-1111-1111-111111111111) is not present in table "organizations".
```

## What was fixed
- Added an **organizations upsert block** at the top so the canonical org rows exist **before** `public.profiles` and `public.memberships` reference them.
- Replaced the hard-coded `document_permissions.role_id` UUID with a **lookup by `public.roles.key = 'client_user'`**.

## Correct local order
1. `npx supabase db reset --no-seed`
2. import local auth users
3. run `attach_real_users.corrected.v2.sql`
4. run `seed.sql`
5. run `verify_seed.sql`

## Why this is needed
`attach_real_users.sql` inserts/upserts `public.profiles` using `default_organization_id`, but your local reset had no organization rows yet. Since `profiles.default_organization_id` references `public.organizations(id)`, the attach step must ensure the canonical org rows exist first.
