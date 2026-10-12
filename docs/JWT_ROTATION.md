# JWT Secret Rotation Runbook

**Owner:** API platform · **Last reviewed:** 2026-10-12

## How JWT auth actually works here

- **Supabase signs.** Sessions are issued by Supabase
  (`signInWithPassword` → `session.access_token` in `apps/api/src/routes/auth.ts`).
  No component in this repository calls `jwt.sign` — the API never signs tokens.
- **The API only verifies.** `requireAuth` (`apps/api/src/middleware/auth.ts`)
  verifies HS256 tokens against the comma-separated `JWT_SECRET` list (first
  entry tried first) and falls back to `supabase.auth.getUser()` when none
  verifies.
- **`JWT_SECRET` is the API's verification copy** of the Supabase project JWT
  signing secret. Rotating only `JWT_SECRET` does **not** change the signer and
  does **not** invalidate tokens issued by Supabase.
- There is **no `JWT_EXPIRY` variable** in this repository. The real access-token
  lifetime is configured in the Supabase project (Auth settings); read the
  current value there instead of assuming.

Consequences for rotation:

| Action                              | Changes the signer? | Effect on existing tokens                                            |
| ----------------------------------- | ------------------- | -------------------------------------------------------------------- |
| Rotate the Supabase signing secret  | Yes                 | New tokens are signed with the new key; old access tokens stop validating at Supabase |
| Update `JWT_SECRET` only            | No                  | Only the API's verification list changes; Supabase-issued tokens are unaffected |

## Scheduled rotation (zero downtime)

1. **Generate the new secret** (legacy symmetric projects: `openssl rand -base64 32`)
   and keep it safe until step 4; do not apply it in Supabase yet.
2. **Pre-stage the API verification copy** — prepend the new value to the
   comma-separated list on the environment the deploy job attaches
   (`prod-approval` for prod, `dev` for dev):
   ```
   Before: JWT_SECRET=old-secret
   After:  JWT_SECRET=new-secret,old-secret
   ```
   ```
   gh secret set JWT_SECRET --env prod-approval --body "new-secret,old-secret"
   gh secret set JWT_SECRET --env dev          --body "new-secret,old-secret"
   ```
3. **Deploy** the API (`gh workflow run deploy-do.yml --ref main -f deploy_target=prod`,
   or the dev deploy). No token is signed with `new-secret` yet.
4. **Switch the signer** — rotate the Supabase project JWT signing secret to
   `new-secret`: Supabase Dashboard → **Project Settings → JWT Keys** (older
   dashboards: Settings → API → JWT Settings) → rotate. New access tokens are
   now signed with `new-secret`; tokens signed with `old-secret` still verify
   against the second list entry.
5. **Wait past the Supabase access-token lifetime** (configured in Supabase →
   Auth; the old list entry only exists for this overlap window).
6. **Remove the old value** (`JWT_SECRET=new-secret`) and deploy again.
7. **Verify**: a token signed with `old-secret` is rejected; a fresh login works;
   existing sessions that refreshed after step 4 still work.

> If the Supabase project uses the newer asymmetric signing keys, the API's
> HS256 check will not match; requests fall back to `supabase.auth.getUser()`
> and still authenticate. Keep `JWT_SECRET` in sync anyway to avoid the slower
> fallback path.

## Environment configuration

| Environment | Deploy job environment | `JWT_SECRET` location                                |
| ----------- | ---------------------- | ---------------------------------------------------- |
| `dev`       | `dev`                  | GitHub Environment `dev` → `JWT_SECRET`               |
| `prod`      | `prod-approval`        | GitHub Environment `prod-approval` → `JWT_SECRET`     |

The Supabase signing secret itself is **not** a GitHub secret — it lives only in
the Supabase project. The GitHub value is injected into the container via the
`.env` file written during deployment (see `.github/workflows/deploy-do.yml`).

> A value set on `prod` while the deploy job reads `prod-approval` is a silent
> no-op. See the consuming-environment table in
> [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md).

## Emergency rotation (compromise)

1. **Rotate the Supabase project JWT signing secret first** (Project Settings →
   JWT Keys). This invalidates every access token signed with the compromised
   secret.
2. **Replace the API copy with the new value only** — do **not** keep the
   compromised value in the list:
   ```
   gh secret set JWT_SECRET --env prod-approval --body "new-secret"
   ```
3. **Deploy immediately** (`gh workflow run deploy-do.yml --ref main -f deploy_target=prod`)
   and wait for the health check.
4. **Revoke refresh sessions** (access tokens are invalidated by step 1, but
   refresh tokens can still mint new ones): per user via the Supabase Auth admin
   API (`auth.admin.signOut(jwt, 'global')`), or in bulk for the affected users
   by removing their rows from `auth.refresh_tokens`/`auth.sessions` in the SQL
   editor.
5. **Verify** the old secret is rejected (a token signed with it must fail) and
   a fresh login works.
6. **Record** the rotation in the Rotation Log in
   [`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) with the incident issue link,
   run URL and verification result.

## Verification

After any rotation, verify:

1. New logins work (tokens signed with the new secret).
2. A token signed with the removed secret is **rejected** (negative check).
3. Existing sessions remain valid while the old secret is still in the list
   (scheduled rotation only).
4. No authentication errors in the API logs beyond the expected re-logins.

## Notes

- The rotation supports **multiple old secrets** simultaneously during the
  overlap window.
- No code changes are required for rotation.
- Rotation is transparent to users on the scheduled path; the emergency path
  logs users out.
- The `JWT_SECRET` must never be logged or exposed in CI/CD logs, and never
  pasted into an issue, postmortem, or the Rotation Log.
