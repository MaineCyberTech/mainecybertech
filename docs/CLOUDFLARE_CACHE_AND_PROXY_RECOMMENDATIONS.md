# Cloudflare Cache and Proxy Recommendations

## DNS Record Model

Cloudflare’s Terraform provider supports `cloudflare_dns_record` and examples commonly show `proxied = true` for A or CNAME records where you want Cloudflare to sit in front of the service.

This pack assumes a Cloudflare-managed DNS pattern with CNAME records for:
- `app.mainecybertech.com`
- `api.mainecybertech.com`
- `app.mainecybertech.us`
- `api.mainecybertech.us`

## Recommendation Summary

### `app.*` hostnames
**Recommended default:** `proxied = true`

Reasoning for this recommendation:
- these are public web application hostnames
- Cloudflare proxying is the normal pattern when you want Cloudflare to sit in front of web traffic
- Vercel custom-domain traffic is commonly connected through DNS records rather than requiring a nameserver migration

### `api.*` hostnames
**Recommended default:** start with `proxied = true` only if your API behavior is confirmed to work correctly through Cloudflare for your headers, TLS expectations, and request handling.

**More conservative rollout option:** begin with `proxied = false` during first verification, then switch to `proxied = true` after confirming application behavior.

## Cache Recommendations

### For `app.*`
- use Cloudflare proxying
- keep SEO/canonical hostname behavior consistent in Vercel
- choose one canonical app hostname per zone and keep redirects intentional in Vercel

### For `api.*`
- prioritize correctness first
- validate the API behind the chosen Cloudflare mode before broad rollout
- if you are troubleshooting origin behavior, temporarily use DNS-only mode (`proxied = false`) until the API behavior is confirmed

## TTL Guidance

Cloudflare examples commonly use `ttl = 1` (automatic) with proxied records. That is a reasonable baseline for these CNAME records unless you intentionally want a different DNS TTL strategy.
