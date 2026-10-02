# Data Breach Response Plan — MCT Platform

**Owner:** Security lead · **Last reviewed:** 2026-10-02 · **Review cadence:** quarterly

This is the *privacy / data-breach* companion to the platform incident response
plan in `docs/INCIDENT_RESPONSE.md`. That document tells you how to run an
incident; this one tells you how to decide whether tenant or customer personal
data was breached, how to assess it, and whether and how to notify.

It is distinct from:

- `SECURITY.md` — how to **report** a vulnerability **to** MCT (an inbound
  channel). It is not our breach-response process.
- `docs/modules/incident-response.md` / `docs/features/security-incident-response.md`
  — the **product feature** by which MSP tenants manage *their own clients'*
  incidents. Not MCT platform breach response.

> Audit reference: created in response to `IR-P0-002` (no data breach response /
> notification process) from run `20261002-0344-develop-6286137`. It closes the
> dependency that `IR-P0-002` recorded on `IR-P0-001` (now
> `docs/INCIDENT_RESPONSE.md`).

## 1. Scope, definitions, and legal frame

### 1.1 Scope

This plan covers any suspected or confirmed breach of **personal data** held by
or processed through the MCT Portal stack (api, web, worker, Supabase PostgreSQL,
object storage, Redis, DigitalOcean infrastructure). It applies to data belonging
to MCT's tenant organisations **and** to the personal data of their end users,
clients, and contacts that tenants have loaded into the platform.

### 1.2 MCT is a small MSP — not a legal authority

**MCT is a small managed-service provider.** We are a data processor for most of
the personal data in this stack (tenant organisations are the controllers) and a
controller for our own staff, prospect, and account data. The **specific
obligations — who must be notified, within what deadline, in what form, and to
which supervisory authority — depend on the jurisdictions our tenants and their
data subjects are in, and on the contracts (DPAs) we have signed with each
tenant.** This document therefore:

- does **not** name a regulator, statute, or a fixed statutory deadline as fact;
- states deadlines as targets and marks all jurisdiction-specific steps as
  **CONFIRM WITH COUNSEL**;
- treats the decision to notify as a legal decision, not an engineering one.

**Places where Legal / DPO review is mandatory (marked `CONFIRM WITH COUNSEL`
throughout this plan):**

| Step | Why counsel is required |
|---|---|
| Whether a "personal data breach" is reportable at all | Definition and threshold are jurisdiction-specific |
| Which supervisory authority / regulator receives notice | Depends on jurisdiction and controller establishment |
| The notification deadline (the "clock") | Varies by jurisdiction; do not assume a number |
| Whether **tenants** (controllers) or **MCT** notifies **data subjects** | Determined by DPA role split and contract |
| Whether a **processor-only** breach triggers MCT notification duties or only a duty to inform the controller | Depends on controller/processor role and the DPA |
| Cross-border transfer and representation duties | Depends on data residency and transfer mechanism |
| Content and language of any public disclosure | Legal/PR risk |

### 1.3 Definitions

| Term | Meaning here |
|---|---|
| Personal data | Any information relating to an identified or identifiable person held in the stack: names, emails, phones, job titles, auth identifiers, IP addresses, and any tenant-client contact or employee records |
| Data subject | The individual the personal data relates to |
| Controller / Processor | Tenant organisation / MCT, respectively, for tenant-loaded client data (to be confirmed per DPA) |
| Personal-data breach | A breach of **confidentiality**, **integrity**, or **availability** of personal data (§2) |
| Reportable breach | A breach that, **on counsel's advice**, triggers a notification duty |
| Breach register | The durable record of every breach and its notification decision (§9) |

### 1.4 Interface with the platform IR plan

`docs/INCIDENT_RESPONSE.md` runs the incident. The moment a security or
confidentiality incident is *possible*, the IC must invoke **this** plan and
assign the Security lead to own the breach decision (§7). Severity in this plan
(§4) is a *privacy* severity and may differ from the platform Sev-1/2/3.

## 2. What counts as a personal-data breach

A breach is any loss of **confidentiality**, **integrity**, or **availability**
of personal data. Availability and integrity losses are breaches even when no
attacker is involved. Grounded in this stack:

### 2.1 Confidentiality

- **RLS / policy regression exposing another tenant's rows.** A migration or
  policy change makes a previously isolated table readable cross-tenant — e.g.
  `profiles`, `phishing_targets`, `store_leads`, `vendor_contacts`,
  `identity_verifications`, `offboarding_checklists`, `break_glass_accounts`.
  The RLS allow-list model (`docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md`)
  means a configuration flip can silently widen access. See `IR-P1-006`.
- **Leaked `SUPABASE_SERVICE_ROLE_KEY`.** The service role **bypasses RLS**
  entirely. Any use of it against `profiles` (names/emails/phones, and the
  `encrypted_pii` mirror) or `audit_logs` is a confidentiality breach.
- **Leaked tenant credential / user JWT.** Account takeover of a `memberships`
  user exposes that org's data.
- **`phishing_targets` exfiltration.** This table explicitly stores `email` and
  `name` of an organisation's employees for simulation — a high-sensitivity
  employee list held for the purpose of *testing* those employees.
- **Bulk export abuse.** `/audit` read/export (admin-gated, limit 10000) and any
  bulk-download of `documents` / `contracts` / `contract_signers` (which hold
  `email` and `signer_name`).
- **Leaked or stolen backup.** Daily `pg_dump` objects in S3 (`db-backup.yml`,
  `scripts/backup-database.sh`) contain the full personal-data set.

### 2.2 Integrity

- **Unauthorised modification** of `profiles`/`memberships` (e.g. adding a role,
  flipping `status` to approved), `contract_signers` (`signed_at`, `status`),
  or `identity_verifications` (`verification_pass`, `authorized_by`).
- **Tampering with `audit_logs` or `impersonation_log`** to remove evidence.
- **`mfa_recovery_codes` or auth records corrupted/altered** so a user cannot
  prove their identity.
- **Data poisoning of tenant records** by a compromised integration/webhook.

### 2.3 Availability

- **Ransomware / deletion / accidental drop** affecting any table above.
- **Backup loss** (the S3 objects are the only durable copy — see `IR-P0-003`
  and the `DR-P0-001`/`DR-P0-002` findings on scheduled backups).
- **Extended loss of access** to personal data such that subjects' rights (e.g.
  access/erasure requests) cannot be met.
- **Corrupted restore** that yields a backup missing recent rows (integrity +
  availability; `IR-P1-004`).

## 3. Detection sources

Detection comes from the platform signals in `docs/MONITORING_AND_ALERTING.md`
plus human reports. The real sources for a *breach* are:

| Source | What it reveals | Where |
|---|---|---|
| `audit_logs` table | Who did what to which entity, from which IP; rows written by `apps/api/src/services/audit.ts` (PII fields redacted). An "audit trail gap" is logged on insert failure — treat as a coverage loss. | `audit_logs`; service `apps/api/src/services/audit.ts` |
| `impersonation_log` table | Platform-admin cross-tenant access (`actor_user_id`, `organization_id`, `reason`, `ip_address`). Unexpected volume or unexpected orgs = investigate as possible breach. | `impersonation_log` |
| Sentry | Exceptions, e.g. DB errors on RLS-enabled modules, unexpected 403/empty-result spikes. | API/worker/web Sentry init |
| Prometheus rules | `MCTServiceDown`, `MCTHighRequestErrorRate`, and `Watchdog`. | `infra/digitalocean/prometheus.rules.yml` |
| CI / CodeQL / secret scan | A committed secret (leaked service-role key, JWT secret, connection string) caught pre-commit or in CI. | `.husky/pre-commit`, `scripts/scan-secrets.sh`, `test.yml` `secrets-scan`, `codeql.yml` |
| Tenant / user reports | "I can see another org's data", "my invoice is wrong", unexpected logins. | Support channel → security@mainecybertech.com |
| Backup / restore jobs | Backup failure notices, restore anomalies (`db-backup.yml`, `db-restore-test.yml`). | GitHub Actions notifications + `SLACK_WEBHOOK_URL` |
| Third-party notification | Supabase, DigitalOcean, Stripe, Cloudflare, Atlassian, Microsoft report an incident on their side. | Vendor security contact |

**Known detection gap — must be stated in any breach timeline.** Alertmanager is
**not deployed**; `prometheus.rules.yml` says delivery requires it. The `Watchdog`
rule has no receiver, so a total loss of the monitoring path is silent. This is
audit `IR-P0-003` and `IR-014`; until fixed, a breach could be detected late or
by the tenant first. Track the fix as a P1 in the risk register.

Additional low-visibility signals called out by the audit — audit-write failures,
webhook dead-letter growth, worker health, and RLS regressions — currently have
**no alert** (`IR-P1-006`, `IR-P1-003`, `IR-009`) and must be checked manually
during a suspected breach.

## 4. Triage and severity matrix for breaches

Declare breach severity within **60 minutes** of a credible report. Privacy
severity is independent of platform Sev.

| Breach severity | Trigger | Examples | Response target |
|---|---|---|---|
| **B-1 Critical** | Confirmed/suspected exposure of personal data across tenants or at scale; or special-category-like sensitivity | Suspected service-role key abuse; cross-tenant RLS exposure; `phishing_targets`/`profiles` exfiltration; stolen backup | Contain **immediately**; legal engaged within 24h; notification decision within the counsel-confirmed window |
| **B-2 High** | Confirmed exposure limited to a single tenant or few subjects; or integrity loss with real impact | Single-tenant credential compromise; unauthorised edit of `contract_signers`/`identity_verifications`; loss of one org's documents | Contain within hours; assessment same day |
| **B-3 Moderate** | Potential exposure, unconfirmed; or availability loss with no evidence of access | Suspicious admin `impersonation_log` activity; failed/partial backup; transient monitoring blind spot over the data window | Assess within 72h; decide reportability with counsel |
| **B-4 Low** | No personal data impacted, or exposure of non-personal data only | Config leak with no PII; outage with no data access | Record in register; no notification expected |

Escalate B-3 → B-2/B-1 if the population affected grows, if evidence of access
appears, or if a monitoring gap prevented accurate scope determination.

## 5. Containment playbooks

General rule (from `docs/INCIDENT_RESPONSE.md` §4.2): **revoke first, investigate
after** — revocation preserves the audit trail. Preserve evidence per §8 before
destructive actions. Never paste a secret value anywhere; reference its name and
location only.

### 5.1 Leaked service-role key (`SUPABASE_SERVICE_ROLE_KEY`)

1. Revoke/rotate the key in Supabase (source of truth) and rotate **all consumers**
   (API, worker) per `docs/SECRETS_ROTATION.md` emergency procedure; update the
   GitHub environment secret and redeploy so `.env` is rewritten.
2. Treat everything the service role can reach as potentially exposed: it bypasses
   RLS on **all** tables, including `profiles` (and `encrypted_pii`), `audit_logs`,
   `impersonation_log`, `mfa_recovery_codes`, `phishing_targets`.
3. Pull recent `audit_logs` and Supabase access logs for the exposure window;
   identify anomalous reads/exports.
4. Sessions: force logout / invalidate affected tokens where possible
   (`docs/JWT_ROTATION.md` for JWT-side rotation).
5. Decide B-1; assess data categories and subject counts per §6.

### 5.2 Leaked tenant credential / user session

1. Revoke the user's sessions and reset credentials; force MFA re-enrollment.
   Consider invalidating `mfa_recovery_codes` for the user.
2. Read `audit_logs` for that `actor_user_id` to determine what they reached.
3. Determine the org(s) and tenants touched (cross-tenant only via platform-admin
   roles — check `impersonation_log`).
4. If the account is a **platform admin**, check the `PLATFORM_ADMIN_KEYS` /
   cross-tenant traversal path (`CHAIN-P1-001` in the audit) and treat as B-1.

### 5.3 RLS / policy regression

1. **Stop the widening first**: disable writes for the affected module (RLS
   allow-list is per-module; see `docs/RLS-rollout.md`) or roll back the offending
   migration (`docs/ROLLBACK_PROCEDURES.md` §3). Prefer rollback of the policy
   over broad outage.
2. Identify the exact tables/policies affected via `docs/RLS-coverage-matrix.md`
   and `scripts/verify-rls.mjs`; run the multi-tenant isolation probe.
3. Determine the **exposure window** (deploy/migration time → fix time) and query
   `audit_logs` for access by non-member users during it.
4. If any other tenant was readable, treat as B-1 and assess per §6.

### 5.4 Compromised backup

1. Assume the S3 object set is exposed: it contains the full personal-data set.
   Revoke/rotate the S3 credentials and any `S3_BUCKET` / `S3_BACKUP_BUCKET`
   secrets, plus adjacent CI credentials (`CI_SSH_PRIVATE_KEY`, `DO_API_TOKEN`).
2. Preserve the object list, timestamps, and access logs before deletion or
   re-encryption.
3. Verify whether backup encryption and bucket policy were in place; note any
   inconsistency already flagged (`IR-P1-005`).
4. Rebuild/verify backups from a trusted point (see §8 for evidence handling);
   treat as B-1 given full-population exposure.

### 5.5 Compromised third-party integration

1. Revoke the integration's credentials at the source (Stripe, Atlassian/JSM,
   Microsoft/M365, Jira, Teams webhooks) per `docs/SECRETS_ROTATION.md`.
2. Disable the corresponding worker tasks / webhook endpoints (`webhook_endpoints`,
   `webhook_dead_letters`) if they can be used to exfiltrate or inject data.
3. Review `audit_logs` and `webhook_deliveries` for the integration's footprint.
4. If the vendor announced an incident, record their advisory in the register and
   use their scope to inform §6; where the vendor is a **sub-processor**, the
   tenant's DPA may drive notification — **CONFIRM WITH COUNSEL**.

## 6. Assessment: data categories and number of subjects

The purpose of assessment is to answer, for counsel: *what categories of personal
data, how many data subjects, and what harm is foreseeable.*

### 6.1 Data-category map (real tables)

| Category | Tables |
|---|---|
| Identity / contact | `profiles` (`full_name`, `email`, `phone`, `title`, `avatar_url`, `encrypted_pii`), `memberships` (`job_title`, billing/security-contact flags), `contract_signers` (`email`, `signer_name`) |
| Tenant organisation & billing | `organizations` (`billing_email`, `primary_domain`), `organization_domains`, `billing_customers`, `subscriptions`, `invoices`, `payments` |
| Client / prospect contacts | `store_leads`, `vendor_contacts` (`contact_name`, `email`, `phone`), `identity_verifications` (`requestor_name`, `requestor_email`) |
| Employee records (tenant's clients) | `phishing_targets` (`email`, `name`), `offboarding_checklists` (`employee_name`, `employee_email`), `onboarding_clients`, `break_glass_accounts` (custodian) |
| Authentication / security | `auth.users` (Supabase-managed), `mfa_recovery_codes` (hashes only), `api_keys`, `break_glass_accounts` |
| Activity / audit (contains actor identifiers and IP) | `audit_logs` (`ip_address`, `user_agent`, `actor_user_id`), `impersonation_log` (`ip_address`, `user_agent`, `reason`) |
| Content that may embed PII | `documents`, `document_versions`, `document_shares`, `chat_messages`, `tickets`, `ticket_comments`, `dynamic_form_submissions`, `satisfaction_pulses`, `training_enrollments` |

> Note: `profiles` keeps plaintext `full_name`/`email`/`phone`/`title` as the
> response source of truth and additionally stores an AES-256-GCM `encrypted_pii`
> mirror (migration `5302135`). A database read therefore exposes plaintext PII.
> `audit_logs.metadata` is PII-redacted at write time by
> `apps/api/src/services/audit.ts`, but `ip_address`/`user_agent`/`actor_user_id`
> are still personal data.

### 6.2 Counting data subjects

1. Query the affected tables read-only for distinct subjects
   (`profiles.id`, `contract_signers.email`, `phishing_targets.email`,
   `store_leads`, `vendor_contacts.email`, plus `actor_user_id` in the audit
   tables).
2. Group by `organization_id` to produce a **per-tenant** count — that is the
   unit tenants will ask about.
3. Distinguish **confirmed accessed** vs **potentially accessible** rows from the
   exposure window; record both, clearly labelled.
4. Record whether `encrypted_pii` was additionally exposed and whether the
   encryption key was in scope (if the key was also exposed, treat the ciphertext
   as plaintext).
5. Do **not** copy personal data into the incident channel or the register beyond
   the minimum needed (counts and identifiers, not full records).

## 7. Notification decision

### 7.1 Who decides

- The **Security lead** owns the assessment and presents the facts.
- The **Incident Commander** runs the incident and communication cadence.
- The **notification decision is made jointly by the Security lead and Legal /
  DPO**, recorded in the breach register, and approved by MCT leadership before
  any external notice.

**No external notification (tenant, regulator, or data subject) is sent without
Legal's explicit decision.** Engineering never notifies regulators or data
subjects directly.

### 7.2 What must be recorded (the decision record)

For every potential breach, record in the register (§9):

- date/time of discovery and detection source;
- whether it is a personal-data breach, and of which kind (§2);
- categories and approximate number of subjects and records (§6);
- likely consequences / risk of harm;
- the containment actions and times;
- **the notification decision** — notify (tenant / regulator / data subject) or
  not — with the **rationale**;
- who decided (names) and when;
- if not notified, why not, and what evidence supports that;
- any **CONFIRM WITH COUNSEL** items and their resolution.

### 7.3 Three notification tracks

| Track | Who is notified | Who notifies | Timing |
|---|---|---|---|
| **Tenant (controller)** | Affected tenant organisation(s) | MCT | Promptly after confirmation — tenants are the primary audience and usually the controllers. **CONFIRM WITH COUNSEL** as to contractual notice windows in the DPA. |
| **Regulator** | Supervisory authority, if any, as advised | MCT and/or tenant per role | **CONFIRM WITH COUNSEL** — the authority and the deadline are jurisdiction-specific. Do not assume a fixed number of hours or days. |
| **Data subject** | Affected individuals | Usually the **tenant** as controller; MCT may do so under contract | **CONFIRM WITH COUNSEL** — whether MCT or the tenant notifies, and in what form, is contract- and jurisdiction-specific. |

For **processor-only** breaches, MCT's default position is to notify the affected
tenant(s) promptly and to support the tenant's own regulator/data-subject
notification; the exact split is per DPA and **CONFIRM WITH COUNSEL**.

### 7.4 Notification-content template (placeholders only)

> **Subject:** [Security notice — potential personal-data breach] [Incident ref: BREACH-YYYY-NNN]
>
> Dear [recipient],
>
> We are writing to inform you of a [confirmed / suspected] personal-data breach
> affecting [organisation name / data subjects].
>
> - **What happened:** [plain-language description; no speculation about cause]
> - **When it was discovered:** [date/time, timezone]
> - **When it may have occurred:** [window, or "under investigation"]
> - **What data was involved:** [categories — e.g. names, email addresses; do not
>   enumerate individuals in the body]
> - **Approximate number of individuals affected:** [count, per your organisation]
> - **What we have done:** [containment and remediation actions to date]
> - **What we are doing next:** [next steps and timeline]
> - **What you can do:** [practical guidance — e.g. reset credentials, watch for
>   phishing; validated with Legal]
> - **Who to contact:** security@mainecybertech.com / [named contact]
>
> We will provide an update by [date/time]. This notice is issued in accordance
> with [applicable duty — CONFIRM WITH COUNSEL].
>
> [Signature / role]

Rules for all notifications: state what is known, what is not known, and when the
next update comes. **Never speculate** about cause, attacker, or scope beyond the
assessment. The Communications lead is the single source of external truth
(`docs/INCIDENT_RESPONSE.md` §5).

## 8. Evidence preservation and chain of custody

1. **Preserve before remediating where safe.** Rotating a revoked key does not
   require deleting the audit trail. Capture, where possible:
   - a read-only snapshot of relevant `audit_logs` / `impersonation_log` rows;
   - Supabase access/query logs for the exposure window;
   - Sentry issue exports and relevant pino logs (redacted);
   - the S3 object listing and access logs for any backup exposure;
   - Git history / migration diff that introduced an RLS regression.
2. **Single canonical timeline** owned by the **scribe**, following
   `docs/INCIDENT_RESPONSE.md` §6.
3. **Chain of custody** — for each preserved item record: what it is, where it is
   stored, who captured it, when, how (hash if practical), and any transfer.
   Store evidence in a dedicated, access-controlled location separate from the
   live system.
4. **Do not** place secret values, raw credentials, or full personal-data dumps
   into the incident channel, the register, tickets, or the postmortem. Reference
   the secret by name and location only.
5. Retain evidence per the applicable retention duty (**CONFIRM WITH COUNSEL** /
   per `retention_policies` where configured) — longer than normal once a breach
   is declared.

## 9. Breach register

Maintain a durable register — one row per incident — as the system of record for
breach decisions and exercise evidence. Store it in an access-controlled location
(not in the public repo and not in the incident channel).

| Field | Description |
|---|---|
| `breach_id` | `BREACH-YYYY-NNN` |
| `discovered_at` | Date/time of discovery (tz) |
| `detection_source` | `audit_logs` / Sentry / Prometheus / secret-scan / tenant report / vendor / other |
| `declared_by` | Person who declared |
| `severity` | B-1 / B-2 / B-3 / B-4 (§4) |
| `breach_kind` | confidentiality / integrity / availability (may be combined) |
| `summary` | Short, non-sensitive description |
| `tables_involved` | Named tables (e.g. `profiles`, `phishing_targets`) |
| `category_of_data` | Categories per §6.1 |
| `subjects_affected_confirmed` | Count (or range) |
| `subjects_affected_potential` | Count (or range) |
| `tenants_affected` | Count / identifiers |
| `exposure_window_start` / `exposure_window_end` | Best estimate (tz) |
| `contained_at` | When containment completed |
| `notification_decision` | notify / not-notify, plus rationale |
| `notification_decision_by` | Names + role |
| `legal_reviewed` | Yes/No + counsel/DPO reference |
| `tenant_notifications_sent` | Count + dates |
| `regulator_notifications_sent` | Count + dates (**CONFIRM WITH COUNSEL**) |
| `data_subject_notifications_sent` | Count + dates (**CONFIRM WITH COUNSEL**) |
| `outcome` | Closure summary / ongoing |
| `linked_findings` | `AREA-Px-NNN` / audit IDs |
| `status` | open / contained / closed |

The register is reviewed at the quarterly plan review; any row left `open` past
its target is escalated.

## 10. Post-incident review and risk register

Within **5 business days** of closing a breach, the Security lead produces a
blameless post-incident review using the platform-IR postmortem format
(`docs/INCIDENT_RESPONSE.md` §4.4) with a **breach-specific** addition:

- What personal data was actually affected, and was the assessment accurate?
- Did detection sources (§3) work, and how long did detection take? Explicitly
  record whether the **Alertmanager gap** (`IR-P0-003`) or an unalerted signal
  (`IR-P1-006`, `IR-009`) contributed to latency.
- Was the notification decision reached in time, and was it correct?
- What evidence-preservation or chain-of-custody steps were missed?

**Feeding the risk register.** Every breach finding is filed into the risk
register using the **`AREA-Px-NNN`** convention used by the audits (e.g.
`AREA-P1-007`), where `Px` is the priority (P0/P1/P2/P3) and `NNN` is a
zero-padded sequence. Each entry names: the finding, the priority, the owner, a
**dated** action item, and the acceptance/verification method. Link the register
row back to the `breach_id` and to any audit finding it relates to (e.g. an RLS
regression links to `IR-P1-006` and the RLS domain).

An incident that produces no documentation, config, or control change is **not
closed** (same rule as `docs/INCIDENT_RESPONSE.md` §4.4). Update this plan, the
containment playbooks in §5, or the detection sources in §3 whenever the review
shows a gap — and re-run the relevant tabletop scenario from
`incident_tabletop_scenarios.md`.

## 11. Related documents and current gaps

| Document | Purpose |
|---|---|
| `docs/INCIDENT_RESPONSE.md` | Platform incident response (severity, roles, phases, postmortem) |
| `docs/SECRETS_ROTATION.md` | Secret inventory + emergency rotation used by §5 |
| `docs/JWT_ROTATION.md` | Zero-downtime JWT rotation |
| `docs/RLS-rollout.md`, `docs/RLS-coverage-matrix.md` | Tenant-isolation model and coverage |
| `docs/MONITORING_AND_ALERTING.md` | Detection signals and logging |
| `docs/ROLLBACK_PROCEDURES.md` | Migration/DB rollback used by §5.3 |
| `docs/RTO_RPO.md` | Backup/restore targets referenced by §2.3 |
| `SECURITY.md` | How to **report** a vulnerability to MCT |

Known gaps that limit this plan until fixed (track in the risk register):

- **No Alertmanager / off-box receiver** (`IR-P0-003`, `IR-014`) — silent
  monitoring loss; delayed breach detection.
- **No runtime RLS-regression alert** (`IR-P1-006`) — confidentiality breaches in
  §2.1 may be noticed only by a tenant.
- **No alert on `audit_logs` write gaps or admin/impersonation abuse**
  (`IR-009`, `IR-012`) — evidence of a breach may go unnoticed.
- **Scheduled backup/restore not proven to run / verify deeply**
  (`DR-P0-001`, `DR-P0-002`, `IR-P1-004`, `IR-P1-005`) — an availability breach
  may be discovered only during recovery.
- **On-call rota unassigned** (`docs/INCIDENT_RESPONSE.md` §8) — escalation
  contacts for this plan are not yet named.

**Owner:** Security lead · **Review cadence:** quarterly, and after every
declared breach.
