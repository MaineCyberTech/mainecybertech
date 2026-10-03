# MFA (TOTP) — Management & Enforcement

MFA is **Supabase-native** (GoTrue TOTP). No TOTP secrets are stored in our
database — `auth.mfa_factors` is owned by GoTrue. The only MFA-related table we
own, `public.mfa_recovery_codes`, holds scrypt hashes of single-use recovery
codes (see [Recovery / lost device](#recovery--lost-device)).

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

## Login second factor

The login form is two-step. `POST /api/v1/auth/sign-in` returns
`mfaRequired: true` when the user has a verified TOTP factor (computed via the
same cached `userHasVerifiedFactor()` used by enforcement; failures fail open).
The web flow then:

1. Stores the `aal1` token in a short-lived (`10 min`) `mct_mfa_pending` cookie
   instead of the session cookie (`apps/web/lib/auth/auth-actions.ts`,
   `loginAction`).
2. Shows the "Two-Factor Verification" step on `/login`; the code is submitted
   to `mfaLoginVerifyAction`, which calls the SDK's `auth.mfaFactors()` →
   `auth.mfaChallenge()` → `auth.mfaVerify()`.
3. On success, replaces `mct_session` with the `aal2` token and redirects to the
   resolved landing page. "Use a different account" (`mfaCancelAction`) clears
   the pending cookie.

The code step also offers **Use a recovery code instead**, which spends a
single-use recovery code via `mfaRecoveryLoginAction` (`auth.mfaRecover`), keeps
the pending `aal1` session and lands on
`/portal/profile/security?recovered=1` for re-enrollment.

Test-account one-click login refuses MFA accounts and points to `/login`.

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

## Recovery / lost device

The portal issues **10 single-use recovery codes per user**. They are the
backup path for a lost device: GoTrue TOTP has no read-back, so a factor can
only be replaced, never recovered. Only scrypt hashes are stored
(`public.mfa_recovery_codes`, migration `5302427`); the plaintext batch is
shown exactly once, in the generation response.

| Endpoint                                 | Purpose                                                   |
| ---------------------------------------- | --------------------------------------------------------- |
| `POST /api/v1/auth/mfa/recovery-codes`   | Regenerate the batch; returns the 10 plaintext codes once |
| `GET /api/v1/auth/mfa/recovery-codes`    | Status: `{ remaining, total: 10, lastGeneratedAt }`       |
| `DELETE /api/v1/auth/mfa/recovery-codes` | Revoke every code                                         |
| `POST /api/v1/auth/mfa/recovery`         | Spend a code (`{ code }`)                                 |

SDK equivalents: `auth.mfaGenerateRecoveryCodes()`, `auth.mfaRecoveryCodes()`,
`auth.mfaRevokeRecoveryCodes()`, `auth.mfaRecover(code)`.

- **Generation requires a verified factor; both generation and revocation
  require an `aal2` session when one exists.** `POST /mfa/recovery-codes`
  calls `requireAal2IfEnrolled` (403 for an `aal1` session that has a factor)
  and then rejects a user with no factor with
  `400 "Enroll an authenticator app first"`. `DELETE /mfa/recovery-codes` only
  calls `requireAal2IfEnrolled`, so a user with no factor gets
  `200 { ok: true }` (nothing to revoke). The status endpoint requires no
  second factor and never returns the codes. When an `aal1` session triggers
  the `MFA_REQUIRED` error, the `/portal/profile/security` page prompts for an
  authenticator code inline and retries the operation after a successful
  step-up.
- **Spending a code is a one-way reset.** The matched row is marked used,
  every other code for the user is deleted, and each `verified` `totp` factor
  is removed through the GoTrue admin API. There is no way to mint an `aal2`
  session without verifying a factor, so unenroll is the only sound semantics:
  the user regains access on their `aal1` session and must **re-enroll** from
  `/portal/profile/security`. A spent code cannot be reused; a failed attempt
  is audited (`auth.mfa.recovery.failed`) and touches nothing.
- **Self-service reset (user can still sign in with their password)** is the
  other path, and needs no recovery code: the whole `/api/v1/auth/*` surface
  is exempt from `aal2` enforcement
  (`isMfaExemptPath` in `apps/api/src/lib/mfa.ts`), so a fresh `aal1` session can
  still `GET /api/v1/auth/mfa/factors` for its factor id and call
  `DELETE /api/v1/auth/mfa/factors/:factorId` to remove it — the **Remove**
  control on `/portal/profile/security` issues the same request — then
  **re-enroll** from that page. This is also the path after a password reset.
- **There is no admin-side reset.** `GET`/`DELETE` on
  `/api/v1/auth/mfa/factors*` act on the **caller's own** factors
  (`requireAuth` + the caller's JWT via `getSupabaseUser` in
  `apps/api/src/routes/auth.ts`); no endpoint removes another user's factor. If
  the user cannot authenticate at all, an operator with Supabase project access
  must clear the factor out-of-band through the GoTrue admin API or the
  Supabase dashboard (`Authentication → Users`).
- **Enforcement interaction.** With `MFA_ENFORCEMENT_ENABLED=true`, a user who
  has a _verified_ factor but only an `aal1` session is rejected with
  `403 MFA_REQUIRED` on every non-`/auth/*` route until the factor is removed or
  a challenge is verified. The factor lookup is cached for 60s
  (`apps/api/src/lib/mfa.ts`); spending a recovery code clears that cache entry
  so access is restored immediately.
- **After a reset, sign out and sign back in** (or clear the `mct_session`
  cookie) to get a clean session. A login that was waiting on the removed
  factor holds a stale `mct_mfa_pending` cookie that can no longer complete —
  `mfaLoginVerifyAction` reports "No authenticator app is enrolled", and
  "Use a different account" (`mfaCancelAction`) clears it.

## Remaining work

- SSO (SAML/OIDC) — separate effort; needs a paid Supabase plan and per-org
  provider configuration.
