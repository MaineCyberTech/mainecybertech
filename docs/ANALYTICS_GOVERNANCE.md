# Analytics Governance

**Owner:** @web + data governance · **Last reviewed:** 2026-10-12 · **Review cadence:** quarterly

Event catalog, consent model, retention and vendor list for analytics on the
public marketing site and storefront. This is the accountability document the
audit asked for (AN-P3-001); it complements `docs/PRIVACY.md` (data
classification + retention schedule), `docs/SUBPROCESSORS.md` (vendor list) and
the public policy at `apps/web/app/(public)/privacy/page.tsx`.

## 1. Consent model

| Layer | Implementation | Notes |
| --- | --- | --- |
| Banner + stored choice | `apps/web/components/consent/ConsentProvider.tsx`, `apps/web/lib/consent.ts` | `localStorage["mct-consent-v1"]` (`CONSENT_VERSION = 1`); **default deny** — nothing third-party renders until `analytics: "granted"` is stored. Reopened from the footer "Cookie settings" button. |
| Consent Mode v2 signals | `apps/web/components/consent/AnalyticsScripts.tsx` | `gtag('consent', 'default', {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied'})` is emitted **before** `gtag('config', ...)`; on accept an `update` grants `analytics_storage` only; on withdrawal an `update` denies it again. The ad_* signals stay denied permanently (no ads run on this site). |
| Server-side record | `apps/api/src/routes/public.ts`, `apps/api/src/lib/consent.ts` | `/public/init` stores `consent_at` + `consent_version` on the `public_interactions` row only when the visitor opted in; `/public/submit` and `/store/quotes` require and persist consent. `CONSENT_POLICY_VERSION` (API) must be bumped with material policy changes and kept in sync with the web `CONSENT_VERSION`. |
| Withdrawal | `ConsentProvider` + `AnalyticsScripts` effect | GA receives a denied `update` immediately; already-loaded third-party scripts cannot be unloaded mid-page, so Tawk.to/GA stop collecting on the next page load. The public policy states this behaviour. |
| First-party event gate | `apps/web/lib/catalog/analytics.ts` (`track()`) | Without a stored grant the event stays in the local in-memory log and is never sent to the API. |

## 2. Event catalog (first-party)

Source of truth: the registry at `apps/web/lib/catalog/data/analytics-events.json`
(20 reserved names) and the ingestion route `POST /api/v1/analytics/track`
(`apps/api/src/routes/analytics.ts`, Zod-validated). Payload fields: `event`,
`page`, `productId`/`categoryId`/`promoId`/`quizId`/`quoteId`/`campaignId`,
`anonymousId` (random local id), `metadata` (JSON object), `timestamp`.

AN-P3-006: the API mirrors the registry in `apps/api/src/lib/analytics-events.ts`
and rejects event names outside it, so an arbitrary caller cannot skew the
summary RPC. Metadata is bounded server-side before insert (max 25 keys, scalar
values truncated to 200 chars) and keys that name PII/secret-shaped fields
(`email`, `token`, `ip`, …) are dropped; `catalog-parity.test.ts` fails CI if
the API and web registries drift.

Events **live today** (fired by `StoreAnalyticsTracker`, `ServiceFinderQuiz`,
`QuoteBuilderClient`):

| Event | Fired from | Purpose |
| --- | --- | --- |
| `store_view` | `/store` | Storefront entry volume |
| `category_view` | `/store/category/[slug]` | Category interest |
| `product_detail_view` | `/store/[slug]` | Product interest / funnel top |
| `quiz_complete` | `/store/quiz` | Service-finder completion rate |
| `quote_submit` | `/store/quote` | Quote conversion |

The remaining registry names (e.g. `product_card_view`, `quiz_step_complete`,
`quote_item_add`, `campaign_click`) are **reserved** — they may be emitted by
future UI, but nothing fires them today. Do not treat them as collected data.

## 3. Retention

| Store | Data | Window | Enforced by |
| --- | --- | --- | --- |
| `store_analytics_events` | Anonymous storefront events (no IP/UA, no free text) | 90 days | Worker `retention` task (`storeAnalyticsRetentionDays`, AN-P2-004) |
| `public_interactions` | Visitor session + consent record; IP/UA/geo only after consent | 90 days | Worker `public-interaction-retention` task (daily, batched) |
| Google Analytics | Cookie ids, usage events | GA property data-retention setting (operator-owned) | GA console |
| Tawk.to | Chat session data | Tawk.to account retention (operator-owned) | Tawk.to console |
| Sentry (error telemetry) | Scrubbed error context | Sentry organization retention setting (operator-owned) | Sentry console; SDK `beforeSend` scrub is the primary control (`apps/api/src/lib/sentry-scrub.ts`, `apps/web/lib/sentry-scrub.ts`, `apps/worker/src/lib/sentry-scrub.ts`) |

The retention table in `docs/PRIVACY.md` is the canonical platform schedule; if
the two disagree, `docs/PRIVACY.md` wins and this table is corrected in the same
change.

## 4. Vendors

| Vendor | Role | Personal data | Gate |
| --- | --- | --- | --- |
| Google LLC (Google Analytics) | Usage analytics | Cookie ids, IP (only after accept) | Consent banner + Consent Mode v2 |
| Tawk.to Inc. | Live chat | Messages, IP, browsing context | Consent banner |
| ip-api.com | Visitor geolocation | Visitor IP (HTTPS only, city/region/country fields) | `/init` `consent=granted` (default deny) |
| Functional Software Inc. (Sentry) | Error monitoring | Scrubbed error context (direct identifiers redacted before transport) | Always on (no consent gate); scrubbing + retention documented above |

DPA status, regions and evidence are tracked in `docs/SUBPROCESSORS.md`. A new
outbound analytics vendor is not complete until it appears there, on the public
privacy page, and behind the consent gate where required.

## 5. Change process

1. **New event:** add the name to the registry JSON and to
   `apps/api/src/lib/analytics-events.ts` (the parity test enforces the pair),
   fire it through `track()` (which is consent-gated), and extend §2 here.
   Metadata must not carry form free text, names, emails, phone numbers or
   secrets.
2. **New payload field:** add it to `trackSchema` in
   `apps/api/src/routes/analytics.ts`, document it in §2, and keep it free of
   PII. The API deliberately never stores the caller's IP/user-agent (columns
   dropped in migration `5302441`).
3. **Material policy change:** bump `CONSENT_POLICY_VERSION` (API) and the web
   `CONSENT_VERSION`, and update the public policy in the same PR.
4. **Quarterly review:** confirm the live event list (§2) still matches the
   code, the retention windows still match the workers, and the vendor list
   still matches `docs/SUBPROCESSORS.md`.

## 6. Verification

- `apps/web/__tests__/components/consent/ConsentFlow.test.tsx` — no third-party
  script before consent; Consent Mode default-deny/grant/withdrawal signals.
- `apps/web/__tests__/lib/consent.test.ts` — storage read/write + fail-closed
  defaults.
- `apps/api/src/__tests__/privacy-retention-doc.test.ts` — public retention
  figure matches the worker constant.
- `apps/api/src/__tests__/sentry-scrub.test.ts` — telemetry PII scrub.
