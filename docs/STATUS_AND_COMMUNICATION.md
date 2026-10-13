# Platform Status & Communication Surface

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-11 · **Review cadence:** quarterly

This is the **platform** status/communication surface for MCT's own outages —
where tenants and the public follow an incident affecting the MCT Portal stack.
It is distinct from:

- the tenant-facing status-page **product feature**
  ([`features/public-status-page.md`](features/public-status-page.md)), which lets
  MSP tenants publish *their clients'* service status — not MCT's; and
- the internal alert feed `portal-alerts`
  ([`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9), which carries
  machine alerts for operators, not customer-facing updates.

> Audit reference: created in response to `IR-P2-005` ("no platform
> status/communication surface for MCT's own outages") from run
> `mainecybertech-20261011-0426-full-main-8d299b8`.

## 1. The surface (smallest safe option)

The surface is a **public subscriber topic on the already-deployed ntfy
instance** — no new infrastructure, no new credential class, and no public web
app to secure. It reuses the relay credential the backup/restore workflows
already publish with.

| Item | Value |
|---|---|
| Topic | `portal-status` |
| URL | `https://ntfy.mainecybertech.us/portal-status` |
| Subscribe (browser) | open the URL — the ntfy web view streams posts |
| Subscribe (mobile/desktop app) | ntfy app → Subscribe → server `https://ntfy.mainecybertech.us`, topic `portal-status` |
| Subscribe (JSON / RSS) | `https://ntfy.mainecybertech.us/portal-status/json?poll=1` · `https://ntfy.mainecybertech.us/portal-status/rss` |
| Publish credential | the write-only relay user `portal-relay` (`NTFY_ALERTS_USER` / `NTFY_ALERTS_PASS`) |
| Who posts | Communications lead — single source of external truth ([`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) §5) |
| Cadence | Sev-1: first post within **60 min** of confirmation, updates **hourly**; Sev-2: at each state change; resolution note within 24 h of recovery |
| Templates | [`templates/INCIDENT_COMMS.md`](templates/INCIDENT_COMMS.md) |

> **One-time operator action (`NEEDS-HUMAN`):** the ntfy server's ACLs must
> allow **anonymous read** of `portal-status` and **write** by `portal-relay`.
> After the first test post, verify anonymous read:
> `curl -fsS "https://ntfy.mainecybertech.us/portal-status/json?poll=1"`.
> If the check fails, reserve the topic and grant the ACLs in the ntfy server
> configuration before announcing the topic to tenants. Until the check passes,
> treat the topic as **configured, not verified**, and use direct email to
> affected tenants as the fallback channel.

**Breach incidents are different.** For suspected personal-data breaches, do
**not** post externally without the Security lead + Legal notification decision
([`DATA_BREACH_RESPONSE.md`](DATA_BREACH_RESPONSE.md) §7). Availability and
operations incidents are the use case for this topic.

## 2. Publishing an update

Replace `<...>` and run (never echo the credential):

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
- Never speculate about cause or data exposure; state known, unknown, and the
  next update time.
- No tenant PII, no secret names/values, no internal hostnames.
- Do not post status text to `portal-alerts` — that topic is the machine alert
  feed, not the customer channel.
- Record each post (time, text) in the incident log; the scribe owns the
  canonical timeline.

## 3. Verification record

Replace the placeholder row with the first real verification; keep one row per
check. Do not claim the surface is live until the anonymous-read check passes.

| Date (UTC) | Operator | Test post | Anonymous read verified | Notes |
|---|---|---|---|---|
| _pending_ | _unassigned_ | — | — | Topic ACL not yet verified (operator action) |

## 4. Related

- [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) — §5 communication table, §8 rota
- [`templates/INCIDENT_COMMS.md`](templates/INCIDENT_COMMS.md) — message templates
- [`DATA_BREACH_RESPONSE.md`](DATA_BREACH_RESPONSE.md) — Legal-gated notifications
- [`MONITORING_AND_ALERTING.md`](MONITORING_AND_ALERTING.md) §9 — internal alert path
- [`PLATFORM_FAILURE_RUNBOOKS.md`](PLATFORM_FAILURE_RUNBOOKS.md) — recovery runbooks that post to this surface
