# Secret Rotation Runbook

> Companion artifact to audit prompt 40. Derived from sibling report
> `38_env_secret_rotation.md` (area code **SECRET**) in run
> `20261002-0344-develop-6286137`, repository `mainecybertech/mainecybertech`
> at commit `62861370`.
>
> **Safety:** This runbook describes the *process only*. It contains **no secret
> values** and references environment-variable **names** only. Never paste a
> secret value into this file, a commit, an issue, or a chat.

## Scope and current gaps (evidence)

| Gap | Evidence | Finding |
|---|---|---|
| Webhook/M365/metrics/PII keys not in rotation inventory | `docs/SECRETS_ROTATION.md` lacks `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`, `M365_CLIENT_STATE`, `METRICS_TOKEN`, `TURNSTILE_SECRET_KEY`, `FIELD_ENCRYPTION_KEY` | SECRET-P2-001 |
| Dead config | `M365_WEBHOOK_SECRET` declared (`apps/api/src/config/env.ts:40`) but unused; real M365 auth uses `M365_CLIENT_STATE` (`apps/api/src/routes/webhooks.ts:435`) | SECRET-P1-001 |
| Deploy writer omits keys | `.github/workflows/deploy-do.yml` `envs:`/`printf` block omits `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_CLIENT_STATE`, `METRICS_TOKEN`, `MFA_ENFORCEMENT_ENABLED`, `TURNSTILE_SECRET_KEY` | SECRET-P1-002 |
| No reminder / no evidence | `docs/SECRETS_ROTATION.md:166-191` embeds a reminder YAML that does not exist; rotation log has only the initial row | SECRET-P2-002 |
| Diff-only scanning | `validate.yml`/`test.yml` `secrets-scan` scans `git diff` only; no full-history scan artifact | SECRET-P2-003 |
| Tracked tfvars | `infra/terraform/digitalocean/env/prod.tfvars` tracked despite `.gitignore:57` | SECRET-P2-004 |

## Rotation cadence (recommended)

| Secret class (env var NAMES) | Recommended cadence | Source of truth |
|---|---|---|
| `JWT_SECRET` (comma-separated for multi-secret) | 90 days | `docs/JWT_ROTATION.md` |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` | 180 days | Supabase dashboard |
| `FIELD_ENCRYPTION_KEY` | 180 days (requires re-encrypt plan) | `apps/api/src/lib/field-encryption.ts` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | 90 / 180 days | Stripe dashboard |
| `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_CLIENT_STATE` | 180 days | Provider admin console |
| `METRICS_TOKEN`, `TURNSTILE_SECRET_KEY` | 180 days | Platform-generated / Cloudflare |
| `SMTP_PASSWORD`, `SSH`/`CI_SSH_PRIVATE_KEY`, `DO_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `REDIS_PASSWORD` | 90–365 days per policy | Provider console |

> Fill in or correct cadences in `docs/SECRETS_ROTATION.md`; the table above is
> the recommended target, not a confirmed applied policy.

## Standard rotation procedure (per secret)

1. **Announce and open a change record.** Note the secret NAME, intended time,
   and rollback plan. Do not include any value.
2. **Generate the new value** in the source system (provider console / `openssl`
   / password manager), matching the required format and length.
   - `JWT_SECRET` must be ≥32 chars; use the multi-secret comma form for
     zero-downtime (see below).
3. **Set the new value in the target scope** — never in a file under version
   control:
   ```bash
   gh secret set <SECRET_NAME> --env dev
   gh secret set <SECRET_NAME> --env prod
   gh variable set <VAR_NAME> --env prod   # for non-secret config only
   ```
   (Command shape only; you will be prompted for the value interactively.)
4. **Deploy the new value.**
   - App secrets: trigger `deploy-do` (the droplet `.env` is rewritten and
     `chmod 600`). Confirm the omitted keys above are added to the writer first
     (SECRET-P1-002), or set them manually and record it.
   - JWT: follow `docs/JWT_ROTATION.md` — prepend the new secret to
     `JWT_SECRET` (old,new), deploy, let old tokens expire, then drop the old.
5. **Verify** the dependent feature:
   - API health: `curl -sf https://api.<domain>/health`.
   - Webhooks: Jira/JSM/M365 endpoints return non-`501` when configured
     (they fail closed with `501` when the secret is unset).
   - Email/push: send a test notification.
   - JWT: sign in; old sessions should still work during the overlap window.
6. **Revoke the old value** at the source.
7. **Record** the rotation in `docs/SECRETS_ROTATION.md` (date, NAME, actor,
   scope) — never the value.

## Emergency revocation (compromise)

Use when a secret is suspected leaked. Prefer speed over ceremony, but keep an
audit trail.

1. **Revoke first, investigate second** — disable/rotate the credential at the
   source (Supabase, Stripe, Cloudflare, DO, provider).
2. **Set a fresh value** (`gh secret set … --env prod`) and **redeploy**.
3. **Force logout** if `JWT_SECRET`/sessions are affected: invalidate sessions in
   Supabase (mechanism to be confirmed — SECRET-P3-003).
4. **Rotate adjacent secrets** that the compromised one could unlock (e.g. rotate
   `FIELD_ENCRYPTION_KEY` only with a re-encrypt plan; otherwise assess data at
   rest).
5. **Notify** the owner and record the incident; add a rotation-log entry.
6. **Post-incident:** run a full-history secret scan (SECRET-P2-003) to find any
   committed fragments.

### Break-glass rules

- Requires an incident ticket and a named approver.
- Time-boxed; revert any temporary `enforce_admins`/protection exception
  immediately after.
- Every break-glass action gets a post-incident review entry.

## Hardening actions (from report 38)

| Action | Priority | Finding |
|---|---|---|
| Remove or implement `M365_WEBHOOK_SECRET`; deploy-wire `M365_CLIENT_STATE` | P1 | SECRET-P1-001 |
| Add the six omitted keys to `deploy-do.yml` `envs:` + writer, or document exclusions | P1 | SECRET-P1-002 |
| Add the seven keys to `SECRETS_ROTATION.md` + `GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` | P2 | SECRET-P2-001 |
| Create `.github/workflows/secret-rotation-reminder.yml`; add a `last_rotated` column | P2 | SECRET-P2-002 |
| Add a scheduled full-history secret scan (gitleaks/trufflehog); align `.ps1` with `.sh` | P2 | SECRET-P2-003 |
| `git rm --cached infra/terraform/digitalocean/env/prod.tfvars` | P2 | SECRET-P2-004 |
| Add a CI schema↔example↔docs parity check | P2 | SECRET-P3-001 |
| Create `docs/BREAK_GLASS_RUNBOOK.md` and run a tabletop drill | P3 | SECRET-P3-003 |

## Verification

- After rotation, dependent feature works and `/health` is green.
- `gh secret list --env prod` shows the updated timestamp for the NAME (no
  value printed).
- Rotation-log row exists; `git check-ignore infra/terraform/digitalocean/env/prod.tfvars`
  returns exit 0 after remediation.
- Drill: rotate a non-production secret in `dev`, deploy to `dev`, verify.

## Open questions

- Are `M365_CLIENT_STATE` / `JIRA_WEBHOOK_SECRET` / `JSM_WEBHOOK_SECRET` set on
  live droplets (beyond the deploy writer gap)?
- What is the concrete "force logout all users" mechanism?
- Has the full git history ever been secret-scanned?

*Source report: `38_env_secret_rotation.md`. Prose-only; no secret values are
contained in this document.*
