# IT Break-Glass & Emergency Credential Revocation Runbook

**Owner:** platform/security · **Last reviewed:** 2026-10-12 · **Review cadence:** quarterly

How to **revoke** a compromised platform credential and how to **use an
emergency access path** when the normal one is unavailable — plus where escrow
keys live and how the procedure is drilled. This is the IT-level companion to
[`SECRETS_ROTATION.md`](SECRETS_ROTATION.md) (scheduled rotation + emergency
rotation steps) and `docs/INCIDENT_RESPONSE.md` §4.2 ("revoke first, investigate
after"). It closes audit finding **SECRET-P3-003**.

> This runbook covers **platform** access (GitHub, droplet/SSH, Supabase,
> Stripe, email relay, alert relay, Sentry, encryption keys). The tenant-facing
> `break_glass_accounts` **product module** is separate — see
> `docs/runbooks/break-glass-register.md`.

## 1. Definitions and authority

| Term | Meaning |
| --- | --- |
| Break-glass | One-off emergency use of a privileged credential/path when the normal path is unavailable |
| Revocation | Disabling a credential **at its source** so it can no longer authenticate (preferred over deleting it — revocation preserves the audit trail) |
| Escrow | Offline, sealed copy of a non-rotatable key (`FIELD_ENCRYPTION_KEY`, `BACKUP_ENCRYPTION_KEY`) held by two custodians |

- **Two-person rule:** any break-glass use needs one operator and one approver
  (an org owner / security lead). If no approver is reachable, proceed only for
  an active Sev-1 and notify within 1 hour.
- Every use or revocation is an **incident**: open a ticket/channel, assign an
  Incident Commander, and record the timeline per
  [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md).
- Never paste a secret value anywhere (tickets, chat, logs). Reference the
  secret **name** and location only.

## 2. Emergency access paths and revocation points

| Credential / path | Normal access | Break-glass path | Revoke at source | Then |
| --- | --- | --- | --- | --- |
| GitHub org/repo admin | Named users; branch protection + CODEOWNERS | Org **owner** account with recovery codes (offline, sealed) | GitHub → Org settings → People / PATs | Re-check branch protection (`branch-protection-audit.yml`) |
| Droplet SSH | `CI_SSH_PRIVATE_KEY` deploy key (prod-approval/dev) | DigitalOcean console → droplet root shell | Remove the old public key from `~/.ssh/authorized_keys`; rotate `CI_SSH_PRIVATE_KEY` + `DO_SSH_FINGERPRINT` | Redeploy (`deploy-do.yml` pins the host key) |
| Supabase keys | Dashboard users + `SUPABASE_*` secrets | Supabase dashboard org owner | Supabase → Settings → API → regenerate | Update the consuming environment; redeploy (see `SECRETS_ROTATION.md`) |
| Supabase JWT signing secret | Dashboard | Dashboard org owner | Supabase → Project Settings → JWT Keys | Rotate `JWT_SECRET` verification copy; force logout (`docs/JWT_ROTATION.md` §Emergency) |
| Stripe keys | Dashboard users | Dashboard owner | Stripe → Developers → roll keys/webhook secret | Update secrets; redeploy; verify webhook |
| SMTP credentials | Email provider dashboard | Provider owner | Regenerate app password/API key | Update `SMTP_*`; send test email |
| Alert relay (ntfy/Slack) | Relay account | Relay admin | Regenerate password / recreate Slack webhook | Update `ALERTMANAGER_*` / `NTFY_ALERTS_*`; run the alert-path exercise |
| Sentry | Dashboard | Org owner | Revoke/rotate the client key (DSN) | Update `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`; redeploy |

The consuming **GitHub environment** for each secret (not a reflexive
`--env prod`) is the table in
[`SECRETS_ROTATION.md`](SECRETS_ROTATION.md#consuming-environments-source-of-truth).

## 3. Revocation procedure (any credential)

1. **Declare** the incident; assign IC and scribe (`INCIDENT_RESPONSE.md` §3).
2. **Revoke at the source first** (table above) — do not investigate in place.
3. **Set the replacement** on the *consuming* environment and redeploy the
   affected workflow (`deploy-do.yml` / migrations / terraform).
4. **Verify** per `SECRETS_ROTATION.md` → Post-rotation verification (health
   check, feature check, negative check that the old value is rejected).
5. **Sweep adjacent consumers** (API + worker for Supabase keys; all consumers
   for shared integrations) and run the full-history secret scan
   (`secret-history-scan.yml`).
6. **Record** the revocation in the `SECRETS_ROTATION.md` Rotation Log with
   `Incident? = Yes` + the incident link, and file the post-incident review
   within 5 business days (`templates/POSTMORTEM.md`).

## 4. Break-glass usage procedure

1. Justify in writing (what is unavailable, what the access is needed for) and
   get the approver.
2. Use the narrowest path (prefer a scoped service credential over org owner;
   prefer dashboard over shell).
3. **Time-box** the access; announce start/end in the incident channel.
4. After use: rotate anything the break-glass path touched, remove temporary
   keys/peers, review `audit_logs` + `impersonation_log` for the window, and
   close the ticket with the timeline.
5. Post-incident review (within 5 business days): could the access have been
   avoided? Update this runbook if not.

## 5. Escrow requirements

| Key | Why escrow | Escrow state |
| --- | --- | --- |
| `FIELD_ENCRYPTION_KEY` | Losing it makes `profiles.encrypted_pii` and webhook signing secrets undecryptable | **Gap — location not yet recorded** (open question in `SECRETS_ROTATION.md`) |
| `BACKUP_ENCRYPTION_KEY` | Losing it makes encrypted backups unrestorable | **Gap — location not yet recorded** |

Requirements once an operator records them here:

- Offline copy (sealed envelope / password manager with escrow feature), held by
  **two custodians**; never in GitHub secrets alone and never committed.
- The droplet `.env` holds the runtime copy only; a rotation is not complete
  until the escrow copy is refreshed.
- **Quarterly custody check:** both custodians confirm possession and seal
  integrity; record date + initials in §6. A custody check is not a rotation.

## 6. Drill record

Drills are recorded here and in the `SECRETS_ROTATION.md` Rotation Log
(`dry-run` row). A **live** revocation drill on a non-critical dev secret is the
stronger exercise; until an operator runs one, it stays listed as not done.

### 2026-10-12 — desk dry-run (first exercise, SECRET-P3-003)

- **Type:** desk walk-through. No credential was read, changed, or revoked; no
  secret value was printed.
- **Scope:** followed §3 (revocation) and §4 (break-glass) against the repo and
  checked that every referenced document resolves: `SECRETS_ROTATION.md`
  (consuming-environment table, emergency rotation, post-rotation
  verification), `INCIDENT_RESPONSE.md` §4.2, `DATA_BREACH_RESPONSE.md` §5
  containment playbooks, `GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`, and the
  alert-path exercise.
- **Result:** the documented path is walkable end-to-end from the repo.
- **Gaps found:** (1) escrow location still unrecorded (§5); (2) the live
  revocation drill (rotate a non-critical `dev` secret, confirm the old value is
  rejected) remains operator-gated; (3) `gh secret list` update timestamps are
  not repo-verifiable, so evidence must be a run URL or screenshot in the
  incident record.
- **Next exercise:** quarterly with the rotation reminder; promote to a live
  `dev` rotation when an operator is available.
