# Production vs Testing Environment Operational Runbook

This runbook is written for the repo structure where Terraform lives in `infra/terraform` and where domain operations are split across Cloudflare, Vercel, and AWS.

## 1. Environment Model

### Production
- App hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- Web platform: Vercel production deployment
- API platform: AWS ECS + ALB
- DNS provider: Cloudflare
- Terraform state target: production backend/state key

### Testing
- App hostname: `app.mainecybertech.us`
- API hostname: `api.mainecybertech.us`
- Web platform: Vercel testing/staging deployment or non-production project mapping
- API platform: AWS ECS + ALB for testing
- DNS provider: Cloudflare
- Terraform state target: testing/dev backend/state key

---

## 2. Daily Operations Model

### Normal production app deployment
1. Merge approved web changes to the production branch.
2. Let the Vercel production workflow build and deploy the app.
3. Confirm the Vercel domain remains valid for `app.mainecybertech.com`.
4. Confirm Cloudflare still points at the correct Vercel CNAME target.
5. Validate HTTPS, login, main navigation, and critical user paths.

### Normal testing app deployment
1. Deploy the testing/staging web release.
2. Confirm the Vercel domain remains valid for `app.mainecybertech.us`.
3. Confirm Cloudflare still points at the expected testing Vercel target.
4. Validate HTTPS and testing-only indicators or branding.

### Normal production API deployment
1. Merge API or worker changes to the deployment branch.
2. Allow the GitHub Actions deployment workflow to build and push the image to ECR.
3. Trigger or confirm ECS service rollout.
4. Validate the ALB origin health and API hostname behavior at `api.mainecybertech.com`.
5. Confirm logs and health checks remain healthy.

### Normal testing API deployment
1. Deploy the testing API image to the testing environment.
2. Confirm the testing ECS service is healthy.
3. Confirm Cloudflare points `api.mainecybertech.us` to the intended testing origin.
4. Validate the testing endpoints before changing anything in production.

---

## 3. Cutover Procedure (App Domains)

### Why this order matters
The lowest-risk cutover pattern is:
- prepare the domain inside Vercel first
- inspect the exact DNS target Vercel expects first
- change the single Cloudflare record only after the Vercel side is ready

### Production app cutover (`app.mainecybertech.com`)
1. Add the hostname in Vercel if it is not already assigned.
2. Run `vercel domains inspect app.mainecybertech.com` and capture the exact target Vercel requires.
3. Confirm there are no conflicting or legacy Cloudflare records for the same hostname.
4. Update only the Cloudflare `app.mainecybertech.com` CNAME.
5. Verify Vercel reports valid configuration.
6. Test HTTPS, auth, dashboard navigation, and document/download routes.
7. Only after validation, consider the cutover complete.

### Testing app cutover (`app.mainecybertech.us`)
1. Add or confirm the testing hostname in Vercel.
2. Run `vercel domains inspect app.mainecybertech.us`.
3. Update only the testing Cloudflare CNAME.
4. Verify Vercel valid configuration and SSL.
5. Test environment-specific indicators to make sure you are seeing testing, not production.

### App rollback
If the cutover causes problems:
1. Revert the Cloudflare CNAME to the previous known-good target.
2. Validate the previous hostname behavior.
3. Keep the domain assigned in Vercel while investigating, unless the domain assignment itself is the root issue.

---

## 4. Cutover Procedure (API Domains)

### Production API cutover (`api.mainecybertech.com`)
1. Confirm the production ALB/origin is healthy before changing DNS.
2. Confirm the API ECS service deployment has stabilized.
3. Update only the single Cloudflare DNS record for `api.mainecybertech.com`.
4. Validate health endpoints, auth flows, and any external callback/webhook paths.
5. Review application and ALB logs.

### Testing API cutover (`api.mainecybertech.us`)
1. Confirm the testing ALB/origin is healthy.
2. Confirm the testing ECS service deployment is stable.
3. Update the testing Cloudflare DNS record.
4. Validate smoke tests and expected response headers/behavior.

### API rollback
1. Revert the Cloudflare record to the previous confirmed-good API target.
2. Confirm the previous origin is still healthy.
3. Re-run endpoint checks.

---

## 5. Incident Triage Priorities

When something breaks, check in this order:

### App failures
1. Vercel deployment status
2. Vercel domain assignment and SSL status
3. Cloudflare record target correctness
4. Cloudflare proxy mode
5. browser/server behavior at the application layer

### API failures
1. ECS service health
2. ECS deployment events
3. ALB target health
4. Cloudflare DNS target correctness
5. Cloudflare proxy mode
6. application logs / CloudWatch logs / API health route behavior

---

## 6. Recommended Monitoring and Validation Checklist

### For every production deployment
- verify app HTTPS
- verify API HTTPS
- verify login/auth flow
- verify at least one critical dashboard page
- verify worker queue-backed functionality if applicable
- verify CloudWatch logs are flowing
- verify ECS service remains stable after rollout

### For every testing deployment
- verify the testing hostname is correct
- verify the environment is not pointing to production services by mistake
- validate the testing API and app together before promoting equivalent changes toward production

---

## 7. Recommended Environment Separation Policy

### Keep these separate between testing and production
- Terraform state
- ALB targets
- ECS services if possible
- Cloudflare hostnames
- Vercel environment assignment
- secrets and non-public tokens

### Do not share blindly between environments
- database passwords
- JWT/application secrets
- callback URLs
- DNS targets
- monitoring alerts without environment labeling
