# Vercel Domain Assignment Checklist

Use this checklist for both:

- `app.mainecybertech.com`
- `app.mainecybertech.us`

## Before Starting

- [ ] confirm the Vercel project is the correct web project
- [ ] confirm Cloudflare continues to be the DNS provider
- [ ] confirm you have access to add custom domains in Vercel
- [ ] confirm you can update Cloudflare DNS for the target zone

## For `app.mainecybertech.com`

- [ ] add `app.mainecybertech.com` to the correct Vercel project
- [ ] inspect the domain in Vercel to see the exact DNS record it expects
- [ ] create/update the Cloudflare CNAME record for `app.mainecybertech.com` using the exact target Vercel provides
- [ ] verify the domain reports a valid configuration in Vercel
- [ ] verify SSL was provisioned by Vercel
- [ ] confirm the app loads successfully over HTTPS

## For `app.mainecybertech.us`

- [ ] add `app.mainecybertech.us` to the correct Vercel project or testing/staging setup
- [ ] inspect the domain in Vercel to see the exact DNS record it expects
- [ ] create/update the Cloudflare CNAME record for `app.mainecybertech.us` using the exact target Vercel provides
- [ ] verify the domain reports a valid configuration in Vercel
- [ ] verify SSL was provisioned by Vercel
- [ ] confirm the app loads successfully over HTTPS

## Verification Commands

- `vercel domains ls`
- `vercel domains add <domain>`
- `vercel domains inspect <domain>`
- `vercel certs ls`

## Final Checks

- [ ] production hostname resolves to the production Vercel deployment path you intend
- [ ] testing hostname resolves to the testing/staging Vercel deployment path you intend
- [ ] canonical URL behavior in the app is updated if needed
