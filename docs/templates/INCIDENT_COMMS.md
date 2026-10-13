# Incident Communication Templates

> Fill-in templates for platform incident communication, referenced by
> [`INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md) §5 and the publishing
> procedure in [`STATUS_AND_COMMUNICATION.md`](../STATUS_AND_COMMUNICATION.md).
> Copy the block, fill every `<...>`, delete nothing that applies, and keep the
> same wording on every channel (the Communications lead is the single source of
> external truth).

**Rules for every message**

- State what is **known**, what is **not known**, and **when the next update
  comes**. Never speculate about cause, attacker, or scope.
- No tenant PII, no secret names or values, no internal hostnames — reference
  public domains only (`api.mainecybertech.com`, the status topic).
- For suspected **personal-data breaches**, do not post externally until the
  Security lead and Legal have made the notification decision
  ([`DATA_BREACH_RESPONSE.md`](../DATA_BREACH_RESPONSE.md) §7). These templates
  cover availability/operations incidents, not breach notices.
- Record the times you publish in the incident log (the scribe owns it).

## 1. Internal declaration (post to the incident channel)

```text
[INCIDENT DECLARED] SEV<n> — <short title>
Time (UTC): <HH:MM>
Incident Commander: <name>
Current impact: <what users/customers cannot do>
Known scope: <env: dev|prod; services; tenants affected>
Suspected cause: <hypothesis or "unknown">
Next update in: 30 min (15 min for SEV1)
Tracking: <issue/run link>
```

## 2. Status update (post to `portal-status`, repeat per cadence)

```text
[UPDATE] SEV<n> — <title> — <HH:MMZ>
Status: investigating | identified | monitoring | resolved
What changed since last update: <...>
Current impact: <...>
Action in progress: <...>
Next update in: <...>
```

## 3. Resolution note (post to `portal-status`)

```text
[RESOLVED] SEV<n> — <title> — <HH:MMZ>
Duration: <HH:MM>
Root cause (preliminary): <...>
Fix applied: <...>
Data impact: none | <describe; for personal data this must be Legal-approved>
Postmortem owner: <name> — due <date>
```

## 4. Tenant notification — platform outage (email)

```text
Subject: MCT platform service interruption — <date/time window>

We are aware of an interruption affecting <service(s)> between <start> and
<end> (<timezone>).
Impact: <what tenants experienced>.
Current status: <resolved | monitoring>.
Data: <none known affected | under assessment; no action required | action
required: ...>.
We will provide a follow-up within <window> and a written summary on request.
Contact: <support address>.
```

## 5. Publishing to the status topic (ntfy)

Replace `<...>` and run (never echo the credential; the relay user is
write-only):

```bash
curl -fsS -u "$NTFY_ALERTS_USER:$NTFY_ALERTS_PASS" \
  -H "Title: [SEV1] API outage — investigating" \
  -H "Priority: urgent" \
  -H "Tags: rotating_light" \
  -d "Impact: <...>
Status: investigating
Action in progress: <...>
Next update: <HH:MMZ>" \
  "https://ntfy.mainecybertech.us/portal-status"
```

- One topic, one incident; keep the `[SEV1]` / `[UPDATE]` / `[RESOLVED]`
  prefixes so subscribers can filter.
- Verify the post is visible (`curl -fsS "https://ntfy.mainecybertech.us/portal-status/json?poll=1"`)
  and record it in the incident log.

## 6. Related

- [`STATUS_AND_COMMUNICATION.md`](../STATUS_AND_COMMUNICATION.md) — the surface,
  subscriber instructions, cadence, and the one-time ACL verification.
- [`POSTMORTEM.md`](POSTMORTEM.md) — the follow-up write-up.
- [`INCIDENT_RESPONSE.md`](../INCIDENT_RESPONSE.md) §5 — who speaks, when.
