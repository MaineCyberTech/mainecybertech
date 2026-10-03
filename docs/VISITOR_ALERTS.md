# Website Visitor Alerts & Crawl Policy

## Visitor alerts

`GET /api/v1/public/init` (`apps/api/src/routes/public.ts`) inserts a
`public_interactions` row and, when `PUBLIC_TRAFFIC_WEBHOOK_URL` is set, posts a
"New Website Visitor" Adaptive Card to Microsoft Teams. It is called by the
contact form (`components/marketing/ContactForm.tsx`) and the store intake form
(`components/store/IntakeFormRenderer.tsx`).

Because the endpoint is public, it is hit by crawlers, link-preview bots,
uptime monitors and scanners. Two guards in
`apps/api/src/lib/bot-detection.ts` keep the channel useful:

- `isBotUserAgent()` — matches ~60 crawler/preview/monitor/scanner/HTTP-client
  signatures (and treats a missing UA as a bot). Bots skip the geo-IP lookup
  and never trigger the Teams webhook.
- `shouldSendVisitorAlert()` — at most one alert per IP per **30 minutes**
  (process-local; the API is a single container).

Every `/init` still inserts a row (so the contact form's `trackingId` stays
valid); bot rows are recorded with `is_bot = true` (migration `5302425`) and can
be filtered or purged.

Real leads still work normally: `POST /api/v1/public/submit` fires the
`PUBLIC_LEAD_WEBHOOK_URL` card and optional JSM ticket for submitted forms.

### Tuning

- To stop visitor alerts entirely and keep only lead alerts, unset
  `PUBLIC_TRAFFIC_WEBHOOK_URL`.
- To clean historical noise:
  `update public.public_interactions set is_bot = true where user_agent ~* '(bot|crawl|spider|slurp|uptime|monitor|curl|wget|python)';`
- The 90-day retention task (`apps/worker/src/tasks/public-interaction-retention.ts`)
  bounds table growth.

## Crawl policy

`apps/web/app/robots.ts` currently allows crawling **only** the homepage and the
blog, and disallows everything else:

```
User-Agent: *
Allow: /$
Allow: /blog
Allow: /blog/
Disallow: /
```

`apps/web/app/sitemap.ts` is trimmed to match (homepage, blog index, blog
posts). Note that `robots.txt` is advisory — non-compliant scrapers ignore it,
which is why the bot filter above matters independently. To re-open the
marketing site later, restore the broader `allow`/`disallow` lists in both files
and re-add the service/store routes to the sitemap.
