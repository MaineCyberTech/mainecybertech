# DSAR Runbook (Access / Export / Erasure)

**Owner:** Security Lead / Compliance Sponsor
**Applies to:** Data-subject requests (GDPR Art. 15/16/17/20, CCPA rights) for
data the platform holds about a person — platform accounts, public
contact/quote submissions, and platform audit records.
**Tooling:** `apps/api/src/routes/users.ts` (`GET /users/:id/export`,
`DELETE /users/:id`), admin module exports, `/api/v1/audit/export`.
**Related:** `docs/PRIVACY.md` (classification + retention),
`docs/SUBPROCESSORS.md`, `docs/DATA_BREACH_RESPONSE.md`.

## 1. Intake

1. Requests arrive at `contact@mainecybertech.com` (public policy) or through a
   tenant admin. Log the request in the privacy register (off-repo) with:
   received date, requester, right invoked, subject identity, tenant(s), owner.
2. Respond within **30 days** (published policy). If the request is complex,
   tell the requester within the window that it is extended (GDPR allows two
   further months) and record why.
3. Never disclose data to an unverified requester, and never delete data that
   is under a legal hold without counsel approval.

## 2. Identity verification

- The subject must control the email on the account (`profiles.email` /
  `auth.users`): send a verification challenge to that address and require the
  response, or accept a session-authenticated self-service request.
- For an unauthenticated requester claiming an account, do not proceed on
  knowledge questions alone; escalate to the security lead.
- Record what evidence was checked and when.

## 3. Access / export (Art. 15/20)

### 3.1 Platform identity record

A super admin (or the subject themselves) can export the platform-held record:

```sh
curl -sS -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://<api-host>/api/v1/users/<USER_ID>/export"
```

The response contains `profile`, `memberships` (role + org) and
`permissionOverrides`, plus `exportedAt`. The call writes a
`user.data.export` audit event.

### 3.2 Tenant content

Platform accounts are rarely the whole record. For each tenant the subject
belongs to, collect from the admin surfaces (documents, tickets, chat, forms)
or with read-only SQL against the tenant's tables (`documents`, `tickets`,
`ticket_comments`, `chat_messages`, `dynamic_form_submissions`,
`satisfaction_pulses`, …). Scope strictly to rows attributable to the subject —
do not export other people's data.

### 3.3 Public submissions and audit trail

- Contact/quote submissions: query `public_interactions` and
  `store_quote_requests` by the subject's email (rows older than 90 days are
  already purged for `public_interactions` — state that in the response).
- Audit events about the subject: `/api/v1/audit/export` (JSON/CSV), filtered
  to the subject's `actor_user_id`/`entity_id`. Remember `audit_logs.metadata`
  is key-level redacted at write time.

### 3.4 Response

Provide a machine-readable bundle (JSON) plus a short cover note: what was
included, what was purged under retention, what is held by subprocessors
(`docs/SUBPROCESSORS.md`), and the complaint route. Redact third-party data.

## 4. Erasure (Art. 17)

### 4.1 Standard path (super admin)

```sh
curl -sS -X DELETE -H "Authorization: Bearer <SUPER_ADMIN_TOKEN>" \
  "https://<api-host>/api/v1/users/<USER_ID>"
```

What the endpoint does, in order:

1. Refuses self-erasure and non-super-admin callers.
2. Scrubs the profile (`full_name`, `email`, `phone`, `title`, `avatar_url`,
   `encrypted_pii`, `metadata`, `is_super_admin`) — fail-safe if step 3 fails.
3. Deletes the auth user, cascading the profile row, memberships, permission
   overrides, sessions, MFA factors and recovery codes.
4. Writes a `user.account.erased` audit event (actor, target id, method).

Response is `204 No Content`.

### 4.2 What remains after erasure

| Store | Outcome |
| ----- | ------- |
| `profiles`, `memberships`, `user_permission_overrides`, auth/MFA | Deleted (cascade) |
| `audit_logs` | Retained up to 365 days; `actor_user_id` is set null by FK, `metadata` is PII-redacted |
| Backup buckets | Age out after 30 days |
| Microsoft Teams / Atlassian JSM copies of submissions | Retained under vendor settings — request deletion with the vendor if the subject asks |
| Tenant business records authored by the person | Per tenant decision (controller); do not erase without the tenant's instruction |

State the residual copies in the response.

### 4.3 Anonymisation instead of deletion (legal hold / tenant content)

When deletion is not appropriate (legal hold, contractual record, tenant
controller decision), scrub the identity and keep the row instead:

```sql
-- Service-role / psql as the project owner. Record the ticket id in the audit event.
update public.profiles
   set full_name = null, email = null, phone = null, title = null,
       avatar_url = null, encrypted_pii = null, metadata = '{}'::jsonb,
       is_super_admin = false
 where id = '<USER_ID>';
```

Revoke access without deleting the row: ban the auth user through the Supabase
admin API (`auth.admin.updateUserById('<USER_ID>', { ban_duration: '876000h' })`)
or the dashboard. Avoid direct writes to `auth.*` unless the admin API is
unavailable. Lift the ban only when the hold clears — and then complete the
§4.1 erasure.

Record the anonymisation in the privacy register and as a manual audit note;
do not silently skip the requester response.

## 5. Offboarding (staff / contractor departure)

1. Remove the person's memberships (admin UI or
   `DELETE /api/v1/memberships/:id`).
2. **Membership removal alone does not remove the profile or auth user.**
   Decide with the manager whether the account is expected to return:
   - Not returning → erase the account with the §4.1 endpoint.
   - Returning / hold → keep the account but disable access (ban the auth user)
     and record the reason.
3. Transfer any business records the person owned before erasure.
4. Record the decision and the erasure/anonymisation evidence in the register.

## 6. Evidence and cadence

- Every export/erasure writes an audit event; capture the event id in the
  request record.
- Run a DSAR tabletop at least quarterly (access + erasure, with timings) and
  review `docs/PRIVACY.md` §8 gaps at the same time.
- Keep the privacy register off-repo; this runbook is the procedure of record.

## 7. Escalation

| Situation | Action |
| --------- | ------ |
| Identity cannot be verified | Security lead; do not disclose |
| Request conflicts with legal hold / tenant instruction | Counsel + compliance sponsor |
| Erasure endpoint fails partway | Profile is scrubbed first; retry the auth delete, then verify with the §3.1 export |
| Suspected breach alongside the request | Follow `docs/DATA_BREACH_RESPONSE.md` first |
