# Subprocessors

> Canonical list of vendors that process personal data for the MCT Portal
> platform. Public-facing summary: `apps/web/app/(public)/privacy/page.tsx`.
> Classification and retention: `docs/PRIVACY.md`.
>
> Owner: security lead / compliance sponsor · Last reviewed: 2026-10-11.
> **DPA status is verified against contracts by the operator — "To confirm"
> means this repository cannot prove a signed DPA. Transfer wording (SCCs/UK
> IDTA) must be reviewed with counsel.**

| Vendor | Service | Purpose | Personal data | Region | DPA status |
| ------ | ------- | ------- | ------------- | ------ | ---------- |
| Supabase Inc. | Database, auth, file storage | Portal data store, login/sessions, uploads | Account identity, tenant content, backups | US (project region — confirm) | Supabase DPA; verify executed copy |
| Stripe Inc. | Payments | Subscriptions, invoices, payment lifecycle | Billing email, Stripe customer/subscription ids, amounts (card data stays at Stripe) | US/EU | Stripe DPA; verify executed copy |
| Cloudflare Inc. | Turnstile | Bot protection on public forms | Visitor IP + browser signals at form submission | Global edge | Cloudflare DPA; verify executed copy |
| Functional Software Inc. (Sentry) | Error monitoring | API/web error triage | Error context which may include user ids/emails | US/EU | Sentry DPA; verify executed copy |
| SMTP relay (`SMTP_HOST`) | Transactional email | Invitations, notifications, password resets | Recipient email, message content | Operator-selected provider | **To confirm** (name the provider and sign its DPA) |
| Microsoft Corp. | Teams + Graph | Lead cards, calendar sync for scheduling | Lead contact data, calendar subjects | US/EU | Microsoft DPA; verify executed copy |
| Atlassian | Jira Service Management | Ticket tracking for submitted requests | Requestor name/email, message | US/EU | Atlassian DPA; verify executed copy |
| Google LLC | Google Analytics | Consent-gated usage analytics | Cookie ids, usage events, IP | Global | Google processing terms; verify executed copy |
| Tawk.to Inc. | Live chat | Consent-gated visitor chat | Messages, IP, browsing context | US | **To confirm** |
| ip-api.com | Geolocation | Consent-gated visitor geolocation (HTTPS; only city/region/country fields requested) | Visitor IP | Global | **To confirm** (free endpoint; no DPA on record — operator decision) |
| DigitalOcean | Cloud infrastructure | Hosting for API, worker, web, backups | All platform data at rest | US | DigitalOcean DPA; verify executed copy |

Notes:

- GitHub Actions processes repository code and CI metadata, not tenant or
  visitor personal data; it is a development tool, not a customer-data
  subprocessor.
- The public privacy page must list every vendor in this table; a new outbound
  vendor (env var, SDK, webhook) is not complete until it appears in both
  places and its DPA status is recorded.
- Evidence for the in-code usage of each vendor is referenced in the audit
  run at `docs/audits/repo-deep-dive/mainecybertech-20261011-0426-full-main-8d299b8/`
  (finding PRIV-P2-007 in `risk_register.md` / `patch_plan.md`).
