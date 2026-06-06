# Active Root Dev / Prod Runbook

## Dev / testing
Use the testing zone and testing hostnames:
- `app.mainecybertech.us`
- `api.mainecybertech.us`

### Recommended defaults
- smaller desired counts
- smaller autoscaling limits
- easier DNS/origin verification for API if needed
- separate backend state

### Suggested validation after apply
- confirm Cloudflare testing records target the intended testing origins
- confirm Vercel testing domain assignment is valid
- confirm testing ALB/API health checks pass

## Production
Use the production zone and hostnames:
- `app.mainecybertech.com`
- `api.mainecybertech.com`

### Recommended defaults
- hardened HTTPS active
- autoscaling active
- ECS Exec enabled if operationally desired
- separate backend state

### Suggested validation after apply
- confirm Cloudflare production records target the intended production origins
- confirm Vercel production domain assignment is valid
- confirm ALB HTTPS is healthy
- confirm ECS services stabilize after deployment
