# Deterministic checks — deterministic

Machine checks (no LLM). Findings use the `DET` area.

## Findings

| ID | Title | Severity |
|---|---|---|
| DET-P3-001 | [SEC] gitleaks not installed (secret scan skipped) | P3 |
| DET-P3-002 | [SUPPLY] 3 container image(s) without a digest pin | P3 |

## Detail

### Finding ID: DET-P3-001 - [SEC] gitleaks not installed (secret scan skipped)

Install gitleaks in CI to enable the secret scan.


### Finding ID: DET-P3-002 - [SUPPLY] 3 container image(s) without a digest pin

Pin images by digest (`image@sha256:...`) for reproducible, tamper-evident deploys.

- `infra/digitalocean/docker-compose.yml:69 ${GHCR_IMAGE_PREFIX:-ghcr.io/mainecybertech/mainecybertech}/mct-api:${IMAGE_TAG:?IMAGE_TAG must be set}`
- `infra/digitalocean/docker-compose.yml:131 ${GHCR_IMAGE_PREFIX:-ghcr.io/mainecybertech/mainecybertech}/mct-worker:${IMAGE_TAG:?IMAGE_TAG must be set}`
- `infra/digitalocean/docker-compose.yml:187 ${GHCR_IMAGE_PREFIX:-ghcr.io/mainecybertech/mainecybertech}/mct-web:${IMAGE_TAG:?IMAGE_TAG must be set}`
