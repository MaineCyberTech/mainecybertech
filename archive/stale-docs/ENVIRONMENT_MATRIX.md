# Environment Matrix

## Production

- App URL: `app.mainecybertech.com`
- API URL: `api.mainecybertech.com`
- DNS provider: Cloudflare
- Web hosting: Vercel
- API/worker runtime: AWS ECS Fargate

## Testing

- App URL: `app.mainecybertech.us`
- API URL: `api.mainecybertech.us`
- DNS provider: Cloudflare
- Web hosting: Vercel (testing/staging project or non-production environment)
- API/worker runtime: AWS ECS Fargate (testing environment)

## Suggested Operational Pattern

- use `main` for production deployment automation
- use your existing PR workflows for validation
- keep testing hostnames mapped to non-production infrastructure targets
- keep production and testing Cloudflare records independent so cutovers are simple
