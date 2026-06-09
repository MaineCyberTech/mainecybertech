# Load Testing

Placeholder directory for k6/artillery load-testing scripts.

## Planned

- pi.basic.yml — smoke test of key API endpoints
- pi.scale.yml — ramp-up test for autoscaling validation
- web.pages.yml — page load test for Vercel marketing site

## Usage

When scripts are added:

`ash
k6 run scripts/load-testing/api.scale.yml
`

