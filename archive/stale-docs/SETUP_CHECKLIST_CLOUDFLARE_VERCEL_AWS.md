# Cloudflare / Vercel / AWS Setup Checklist

## Cloudflare
- [ ] confirm the `mainecybertech.com` zone exists and is managed in Cloudflare
- [ ] confirm the `mainecybertech.us` zone exists and is managed in Cloudflare
- [ ] create or confirm a Cloudflare API token with DNS edit/read access for the required zones
- [ ] collect the zone ID for `mainecybertech.com`
- [ ] collect the zone ID for `mainecybertech.us`
- [ ] verify the intended records are:
  - [ ] `app.mainecybertech.com`
  - [ ] `api.mainecybertech.com`
  - [ ] `app.mainecybertech.us`
  - [ ] `api.mainecybertech.us`

## Vercel
- [ ] confirm the web project is the correct production project for the app
- [ ] add `app.mainecybertech.com` to the Vercel project
- [ ] add `app.mainecybertech.us` to the Vercel project or the testing/staging setup
- [ ] run `vercel domains inspect app.mainecybertech.com`
- [ ] run `vercel domains inspect app.mainecybertech.us`
- [ ] record the exact DNS targets Vercel requires for both app hostnames
- [ ] verify Vercel reports valid configuration after DNS is updated
- [ ] verify SSL is provisioned for both app hostnames

## AWS
- [ ] confirm the ECS cluster exists
- [ ] confirm API and worker ECS services exist
- [ ] confirm the ECR repositories exist
- [ ] confirm the ALB exists for the API
- [ ] confirm the production API ALB/public hostname to front with `api.mainecybertech.com`
- [ ] confirm the testing API ALB/public hostname to front with `api.mainecybertech.us`
- [ ] confirm the GitHub OIDC provider and IAM roles are created for GitHub Actions

## GitHub
- [ ] create the required GitHub secrets
- [ ] create the required GitHub repository variables
- [ ] copy the workflow files to `.github/workflows/`
- [ ] verify path filters match your repo layout
