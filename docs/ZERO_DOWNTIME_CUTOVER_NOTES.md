# Zero-Downtime Cutover Notes

This document focuses on cutover for:
- `app.mainecybertech.com`
- `app.mainecybertech.us`

## Goal

Cut traffic over with the least practical disruption by preparing the Vercel domain assignment first and then updating the Cloudflare record only after the target domain is ready.

## App Cutover Pattern

### Step 1: Prepare the domain in Vercel first
For each app hostname:
- add the hostname in Vercel first
- inspect the domain in Vercel first
- confirm the exact DNS target Vercel expects

Do this before changing the Cloudflare record.

### Step 2: Keep the Cloudflare change narrow
When you are ready:
- update only the single Cloudflare CNAME for the app hostname you are cutting over
- do not change unrelated records in the same cutover window

### Step 3: Verify after the DNS change
After the Cloudflare record points at the desired target:
- confirm the Vercel domain status is valid
- confirm SSL is active in Vercel
- test the site over HTTPS

## Production Cutover: `app.mainecybertech.com`
Recommended order:
1. add/verify the production custom domain in Vercel
2. confirm the exact required DNS target from Vercel
3. update the Cloudflare CNAME for `app.mainecybertech.com`
4. verify the app loads successfully and that the production environment is the environment being served

## Testing Cutover: `app.mainecybertech.us`
Recommended order:
1. add/verify the testing custom domain in Vercel
2. confirm the exact required DNS target from Vercel
3. update the Cloudflare CNAME for `app.mainecybertech.us`
4. verify the app loads successfully and that the testing/staging environment is the environment being served

## Why this minimizes disruption
This approach avoids pointing DNS at a hostname before the target project/domain configuration is ready in Vercel.

## Suggested Validation List
- verify the expected page responds over HTTPS
- verify environment-specific branding or indicators match the intended environment
- verify redirect/canonical behavior is still correct
- verify login and critical routes work
