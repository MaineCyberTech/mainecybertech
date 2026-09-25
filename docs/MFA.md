# MFA (TOTP) — Management & Enforcement

MFA is **Supabase-native** (GoTrue TOTP). No TOTP secrets are stored in our
database and no new table exists — `auth.mfa_factors` is owned by GoTrue.

## Management (non-enforcing)

Backend: `apps/api/src/routes/auth.ts` (delegates to GoTrue) + SDK `auth.mfa*`.

| Endpoint                              | Purpose                 |
| ------------------------------------- | ----------------------- |
| `GET /api/v1/auth/mfa/factors`        | List the user's factors |
| `POST /api/v1/auth/mfa/enroll`        | Start TOTP enrollment   |
| `POST /api/v1/auth/mfa/challenge`     | Create a challenge      |
| `POST /api/v1/auth/mfa/verify`        | Verify a challenge code |
| `DELETE /api/v1/auth/mfa/factors/:id` | Remove a factor         |

UI: `/portal/profile/security` (opt-in enrollment), linked from `/portal/profile`.

## Enforcement (`aal2`)

Controlled by `MFA_ENFORCEMENT_ENABLED` (`apps/api/src/config/env.ts`, default
`false`). When enabled, `apps/api/src/lib/mfa.ts` is wired into
`requireAuth` (`apps/api/src/middleware/auth.ts`):

- An `aal1` session that has a **verified** factor is rejected with
  `403 MFA_REQUIRED` on every non-`/auth/*` route.
- A user with **no** factor is never blocked.
- The factor lookup is cached for 60s and **fails open** with a warning — a
  GoTrue blip cannot lock every user out.
- The web admin/portal layouts detect `MFA_REQUIRED` and redirect to
  `/portal/profile/security?mfa=required`, where the challenge is completed.

### Enabling it

1. Enable TOTP at the Supabase project level.
2. Set `MFA_ENFORCEMENT_ENABLED=true` on the API service (deploy env).
3. Verify: an enrolled user gets a step-up page; an unenrolled user is
   unaffected.

## Remaining work

- First-class second-factor step in the login form (today the step-up page
  handles the challenge after login).
- SSO (SAML/OIDC) — separate effort; needs a paid Supabase plan and per-org
  provider configuration.
