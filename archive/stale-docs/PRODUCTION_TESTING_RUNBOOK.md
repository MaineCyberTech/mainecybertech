# Production vs Testing Runbook

## Environment Matrix

### Production
- web hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- web platform: Vercel
- API platform: AWS ECS + ALB
- DNS provider: Cloudflare

### Testing
- web hostname: `app.mainecybertech.us`
- API hostname: `api.mainecybertech.us`
- web platform: Vercel (testing/staging mapping)
- API platform: AWS ECS + ALB (testing mapping)
- DNS provider: Cloudflare

## Normal Deployment Pattern

### Production app (`app.mainecybertech.com`)
1. deploy web changes through the Vercel production workflow
2. confirm the Vercel domain remains valid
3. confirm Cloudflare DNS still points to the expected Vercel target
4. validate the site over HTTPS

### Testing app (`app.mainecybertech.us`)
1. deploy testing/staging web changes
2. confirm the Vercel testing domain remains valid
3. confirm Cloudflare DNS still points to the expected testing target
4. validate the site over HTTPS

### Production API (`api.mainecybertech.com`)
1. push API changes to main
2. allow the ECS deployment workflow to build and push a new image
3. confirm the ECS service rolls successfully
4. validate the API over the production hostname

### Testing API (`api.mainecybertech.us`)
1. deploy the testing API build to the testing environment
2. confirm the testing ECS service/origin is healthy
3. confirm Cloudflare DNS points to the intended testing API target
4. validate the API over the testing hostname

## Cutover and Rollback Guidance

### App cutover
- prepare the custom domain inside Vercel first
- inspect the exact DNS target Vercel expects first
- change only the single Cloudflare record when ready
- validate HTTPS and critical routes immediately after the DNS change

### App rollback
- restore the prior Cloudflare CNAME target if needed
- keep the Vercel domain assignment intact while you verify the rollback path

### API cutover
- confirm the new API origin/ALB target is healthy first
- switch the Cloudflare DNS record only after the new target is ready
- validate health checks and critical endpoints after the change

### API rollback
- revert the Cloudflare record to the previous known-good API target
- confirm the previous target is still healthy before broad validation
