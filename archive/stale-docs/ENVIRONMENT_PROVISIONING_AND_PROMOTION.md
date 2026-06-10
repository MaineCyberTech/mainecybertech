# Environment Provisioning and Promotion Model

## Provisioning model

### Testing/dev provisioning

Terraform provisioning for the testing environment uses:

- Terraform root: `infra/terraform`
- backend config: `env/backend.dev.hcl`
- variable file: `env/dev.tfvars`

That environment provisions or updates the testing infrastructure targets used by:

- `app.mainecybertech.us`
- `api.mainecybertech.us`

### Production provisioning

Terraform provisioning for production uses:

- Terraform root: `infra/terraform`
- backend config: `env/backend.prod.hcl`
- variable file: `env/prod.tfvars`

That environment provisions or updates the production infrastructure targets used by:

- `app.mainecybertech.com`
- `api.mainecybertech.com`

## Promotion path

### Feature work

Developer works locally and opens a PR.

### Validation

PR workflows run:

- Build
- Lint
- Test
- Web preview checks
- Terraform plan against the appropriate environment if infra changes are part of the PR

### Testing promotion

Merge to `develop`:

- testing infra may apply
- testing web may deploy
- testing API and worker may deploy
- migrations may run when Supabase files change

### Production promotion

Merge to `main`:

- production infra may apply
- production web deploy runs
- production API/worker deploy runs

## Why this separation is recommended

- separate state prevents accidental prod modifications from testing commands
- separate DNS hostnames reduce cutover risk
- separate deployment scopes make validation more predictable
