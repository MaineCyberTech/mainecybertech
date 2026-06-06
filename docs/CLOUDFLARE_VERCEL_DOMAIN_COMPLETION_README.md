# Cloudflare + Vercel Domain Completion Pack

This pack is a documentation and completion layer for the Maine CyberTech domain setup using:

- Cloudflare for DNS management
- Vercel for the web application custom domains
- AWS ALB / ECS for the API endpoint custom domains

## Intended Hostnames

### Production
- `app.mainecybertech.com`
- `api.mainecybertech.com`

### Testing
- `app.mainecybertech.us`
- `api.mainecybertech.us`

## What This Pack Includes

- production vs testing domain documentation
- Cloudflare cache / proxy recommendations
- Vercel domain assignment checklist
- zero-downtime cutover notes for both `app.mainecybertech.com` and `app.mainecybertech.us`
- a Terraform example file for Cloudflare DNS values

## Important Design Split

- **App hostnames** are expected to use the DNS values that Vercel tells you to configure for each custom domain.
- **API hostnames** are expected to point at the environment-specific public ALB DNS name (or whichever public API endpoint you want Cloudflare to front).

## Why app targets are not hardcoded here

Vercel’s current custom-domain guide says that for a subdomain, you should inspect the exact DNS records needed for the domain and that a subdomain commonly uses a CNAME target such as `cname.vercel-dns-0.com`, while your project may have a specific value. Use `vercel domains inspect <domain>` to confirm the exact record required for your project before setting the Cloudflare DNS target.
