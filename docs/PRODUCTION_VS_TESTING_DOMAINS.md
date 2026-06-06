# Production vs Testing Domains

## Production Zone: `mainecybertech.com`

### Web application
- Hostname: `app.mainecybertech.com`
- DNS provider: Cloudflare
- Origin/platform: Vercel project custom domain
- DNS record type in Cloudflare: CNAME
- DNS target source: use the exact value returned by `vercel domains inspect app.mainecybertech.com`

### API
- Hostname: `api.mainecybertech.com`
- DNS provider: Cloudflare
- Origin/platform: AWS ALB / ECS API service
- DNS record type in Cloudflare: CNAME
- DNS target source: production ALB DNS name (or another public API hostname you intentionally front through Cloudflare)

## Testing Zone: `mainecybertech.us`

### Web application
- Hostname: `app.mainecybertech.us`
- DNS provider: Cloudflare
- Origin/platform: Vercel custom domain for the testing/staging environment
- DNS record type in Cloudflare: CNAME
- DNS target source: use the exact value returned by `vercel domains inspect app.mainecybertech.us`

### API
- Hostname: `api.mainecybertech.us`
- DNS provider: Cloudflare
- Origin/platform: AWS ALB / ECS API service for testing
- DNS record type in Cloudflare: CNAME
- DNS target source: testing ALB DNS name (or another public testing API hostname you intentionally front through Cloudflare)

## Operational Separation

Keep the production and testing hostnames mapped independently so you can validate testing changes without changing the production DNS records.

A clean pattern is:
- production app → Vercel production target
- testing app → Vercel testing/staging target
- production API → production ALB
- testing API → testing ALB
