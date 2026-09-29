# README.dev.md

# Maine CyberTech Contributor Onboarding Guide

Welcome to the Maine CyberTech development workflow guide. This document is the **single contributor onboarding README** for local setup, VS Code + Git usage, environment file setup, running the app locally, opening pull requests, and understanding how changes move from local development to testing/dev and then to production.

---

## What this guide is for

Use this README if you are:

- setting up the repo for the first time
- using **VS Code** as your primary editor
- using **Git** for day-to-day version control
- contributing code, infrastructure, docs, or workflow changes
- promoting changes through the repo lifecycle:
- local development
- pull request validation
- testing/dev deployment
- production deployment

---

## Repository development model

### Branches

This repo should use a simple and safe branch model:

- `main` → production branch
- `develop` → testing/dev branch
- `feature/*` → normal feature branches
- `fix/*` → bug fixes
- `docs/*` → documentation-only work
- `chore/*` → maintenance/refactor/configuration work

### Environment mapping

#### Testing / dev

- app hostname: `app.mainecybertech.us`
- API hostname: `api.mainecybertech.us`
- Terraform root: `infra/terraform/digitalocean`
- backend config: `env/backend.dev.hcl`
- var file: `env/dev.tfvars`
- expected deployment branch: `develop`

#### Production

- app hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- Terraform root: `infra/terraform/digitalocean`
- backend config: `env/backend.prod.hcl`
- var file: `env/prod.tfvars`
- expected deployment branch: `main`

### Promotion path

1. Work locally on a feature branch
2. Open a PR into `develop`
3. Validate in testing/dev
4. Promote to `main`
5. Deploy to production

---

## Required tools

Install these on your machine before contributing.

### Core developer tools

- **VS Code**
- **Git**
- **Node.js**
- **pnpm**

### Infrastructure / deployment tools

Install these if you will work on infrastructure or deployment-related tasks:

- **Terraform**
- **Supabase CLI**
- **Docker** (for the local stack via the repo-root `docker-compose.yml`; `infra/digitalocean/docker-compose.yml` is the production stack)
- **doctl** (DigitalOcean CLI, optional)

### Recommended VS Code extensions

- **GitHub Pull Requests and Issues**
- **ESLint**
- **Prettier**
- **Terraform**
- **Docker**
- **GitLens** (optional but highly recommended)

---

## Git setup (first time only)

VS Code uses the Git installation on your machine, and the official VS Code docs explicitly state that Git support is built in but depends on your local Git installation. Those same docs also recommend configuring your Git username and email before committing.

Run these once:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

The official Git tutorial also documents the standard first-time flow of initializing a repository, adding files, and committing them.

If you ever need to initialize a local folder as a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
```

---

## Cloning or opening the repo in VS Code

The official VS Code source control docs explicitly say you can start by opening an existing Git repository, cloning one, or initializing one from the current folder.

### Option A — open an existing clone

1. Open VS Code
2. Select **File → Open Folder**
3. Pick the repo root

### Option B — clone from VS Code

1. Open the Command Palette with `Ctrl+Shift+P`
2. Run **Git: Clone**
3. Paste the repository URL
4. Choose a local folder
5. Open the repo when prompted

Once open, VS Code should detect the repository and enable Source Control automatically. The official VS Code docs state that when you open a folder that is already a Git repository, VS Code activates its Git source control features.

---

## Using Git inside VS Code

The official VS Code source control docs explicitly state that you can use the Source Control UI for staging, committing, creating branches, handling merge conflicts, and other Git operations directly inside the editor.

### Source Control view

Open the **Source Control** panel from the Activity Bar or use:

```text
Ctrl+Shift+G
```

There you will typically see:

- changed files
- staged files
- a commit message box
- branch information in the lower status bar

### Common actions in VS Code

Use the Source Control view to:

- review diffs
- stage files
- unstage files
- commit changes
- push / pull / sync
- switch branches
- resolve merge conflicts

### Recommended Git workflow in VS Code

#### Create a feature branch

Click the branch name in the bottom-left status bar and create a new branch.

Recommended naming examples:

- `feature/client-dashboard-updates`
- `fix/api-healthcheck`
- `docs/readme-dev-pass`
- `chore/workflow-cleanup`

#### Review diffs before commit

Before committing, open each changed file in the Source Control view and review the diff.

#### Stage deliberately

Stage only the files you intend to include in the commit.

#### Commit with a clear message

Good examples:

- `Add contributor onboarding guide`
- `Fix Terraform backend variable usage`
- `Update worker deployment workflow`

#### Push branch

Use the Source Control menu or **Git: Push** from the Command Palette.

---

## Using pull requests inside VS Code

The official **GitHub Pull Requests and Issues** extension listing states that the extension supports authenticating to GitHub, listing and browsing PRs, reviewing PRs with in-editor commenting, and checking out PRs directly in VS Code.

### Recommended PR workflow

1. Create and push a feature branch
2. Open a PR into `develop`
3. Review CI results
4. Address comments and update the branch
5. Merge into `develop`
6. Validate testing/dev
7. Promote to `main` only after validation succeeds

### Why use the extension

It is useful because it lets you:

- review comments without leaving the editor
- inspect changed files with normal IDE features
- check out PR branches locally

---

## Environment file setup

Infrastructure is Terraform-rooted at `infra/terraform/digitalocean`, with separate files for testing/dev and production:

- `env/backend.dev.hcl`
- `env/backend.prod.hcl`
- `env/dev.tfvars`
- `env/prod.tfvars`

### Expected environment files

Inside `infra/terraform/digitalocean/env/`, you should have:

```text
env/
├── dev.tfvars
├── prod.tfvars
├── backend.dev.hcl
└── backend.prod.hcl
```

### What they do

- `dev.tfvars` → testing/dev values such as domains, zone IDs and droplet size
- `prod.tfvars` → production values such as domains, zone IDs and droplet size
- `backend.dev.hcl` → points Terraform at the testing/dev state backend
- `backend.prod.hcl` → points Terraform at the production state backend

### Important rule

Never mix dev backend config with prod tfvars, or prod backend config with dev tfvars.

---

## How to run the app locally

The repo's CI jobs use **pnpm** for workspace install/build/lint/test — `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, and `pnpm test` (see `.github/workflows/`).

### Recommended local start sequence

From the repo root:

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

### Web app local workflow

The web app lives in `apps/web`; CI builds it from the repo root with `pnpm --filter web build`, and `e2e.yml` starts it before running Playwright.

A reasonable contributor pattern locally is:

```bash
pnpm --filter web build
```

If your local scripts include a dev server, run that from the repo root or `apps/web` depending on how your package scripts are defined.

### Terraform local validation

If you modify infrastructure, validate locally before opening a PR:

```bash
cd infra/terraform/digitalocean
terraform fmt -recursive
terraform validate
```

### Environment-specific Terraform commands

#### Dev / testing

```bash
cd infra/terraform/digitalocean
terraform init -backend-config=env/backend.dev.hcl
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

#### Production

```bash
cd infra/terraform/digitalocean
terraform init -backend-config=env/backend.prod.hcl
terraform plan -var-file=env/prod.tfvars
terraform apply -var-file=env/prod.tfvars
```

---

## Recommended daily development workflow

### Start of day

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-change-name
```

### While working

- edit files in VS Code
- use the integrated terminal for local commands
- review diffs in Source Control
- run local validation before committing

Example local validation sequence:

```bash
pnpm build
pnpm lint
pnpm test
```

If your changes affect infrastructure:

```bash
cd infra/terraform/digitalocean
terraform fmt -recursive
terraform validate
```

### Commit often

Use small, meaningful commits:

```bash
git add .
git commit -m "Describe the change"
```

### Push and open PR

```bash
git push -u origin feature/your-change-name
```

Then open a PR into `develop`.

---

## How PR validation fits into the workflow

The repo's validation layer (`.github/workflows/`):

- `validate.yml` — reusable deploy gate: dependency audit + tests/coverage + lint + typecheck + OpenAPI validate/coverage + docs-counts, DB-types and RLS-hygiene checks + prompt provenance + review.md sync.
- `test.yml` — push/PR run of the same test and schema guards, plus Trivy and secret scans.
- `lint.yml` / `typecheck.yml`
- `e2e.yml` — Playwright (PR runs; also the prod deploy gate).

So once you open a PR, the expected validation path is:

1. lint and typecheck
2. test execution (unit/integration + schema guards)
3. Playwright E2E if web, package, seed, or migration files changed
4. `terraform fmt`/plan if `infra/terraform/digitalocean/**` changed (plan runs on PRs; apply runs from `develop`/`main`)

This means contributors should expect PRs to be the first official gate after local work.

---

## How changes move to testing/dev

Merges to `develop` run:

- `terraform-do.yml` (DigitalOcean infrastructure)
- `deploy-do.yml` (Build 3 GHCR images + SSH deploy to droplet)
- `supabase-migrations.yml` (runs when `supabase/**` changed)

### Practical meaning

When your PR is merged into `develop`:

- Terraform applies changes to the **dev/testing DigitalOcean droplet** using `env/backend.dev.hcl`
- The web app, API, and worker deploy to the **single DO droplet** behind Caddy via `deploy-do.yml`
- `supabase-migrations.yml` runs when `supabase/**` changed, since that workflow triggers on `develop` and `main`.

### What to validate in testing/dev

Before promoting onward, verify:

- `app.mainecybertech.us`
- `api.mainecybertech.us`
- DNS records point to intended testing targets (Cloudflare A records)
- Docker containers stabilize on droplet (`docker ps`)
- Caddy health checks pass
- critical user flows work as expected.

---

## How changes move to production

Merges to `main` run:

- `terraform-do.yml` (DigitalOcean infrastructure; the prod apply job uses the `prod-approval` environment, which currently has no required reviewers configured)
- `deploy-do.yml` (Build 3 GHCR images + SSH deploy to production droplet)
- `supabase-migrations.yml` (runs as deployment gate)

### Practical meaning

When tested changes are promoted and merged into `main`:

- Terraform applies against the **production DigitalOcean backend** and **production tfvars**
- The web app, API, and worker deploy to the **production DO droplet** behind Caddy via `deploy-do.yml`
- Supabase migrations run as a required gate before the deployment proceeds.

### What to validate in production

After deployment, verify:

- `app.mainecybertech.com`
- `api.mainecybertech.com`
- Cloudflare production records point to intended production targets
- Docker containers healthy on production droplet
- Caddy HTTPS is healthy
- logs are flowing
- critical production flows work.

---

## GitHub Environments, secrets, and variables

Workflows reference these GitHub Environments:

- `dev` — dev deploy, Terraform dev apply, dev migrations.
- `prod` — prod deploy and prod migrations.
- `prod-approval` — Terraform prod apply (`terraform-do.yml`); protection rules
  (required reviewers) are **not** configured yet.

The canonical, verified list of secrets and variables — which workflow uses
each one and whether it is dev/prod scoped — is
[`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md).
Keep that file as the single source; do not duplicate the list here, because a
second copy drifts.

### What you set locally

Local development needs no GitHub secrets. Each service reads a `.env.local`:

- `apps/api/.env.local` — Supabase URL/keys, `JWT_SECRET`, optional integrations (see `apps/api/.env.example`)
- `apps/web/.env.local` — `NEXT_PUBLIC_API_URL` and optional public keys (see `apps/web/.env.example`)
- `apps/worker/.env.local` — Supabase URL/service key, Redis/SMTP/integration settings (see `apps/worker/.env.example`)

The full variable reference is [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md).
The `GITHUB_TOKEN` used for GHCR logins in CI is provided automatically by Actions.

---

## Recommended contributor-safe habits

### 1. Never work directly on `main`

Always start from `develop` and create a feature branch.

### 2. Review diffs before committing

Use VS Code’s Source Control diff view before every commit. The official VS Code docs explicitly describe the integrated diff/editor view as part of normal source-control use.

### 3. Keep commits focused

Avoid mixing unrelated changes in one commit.

### 4. Keep PRs narrow

It is easier to review, test, and rollback smaller PRs.

### 5. Validate locally first

Do not rely only on CI. Run local build/lint/test before pushing.

### 6. Promote in order

feature branch → `develop` → validate → `main`

---

## Troubleshooting notes

### If VS Code does not show Git controls

The official VS Code docs say VS Code depends on your machine’s Git installation. If the Source Control features are missing:

- make sure Git is installed
- make sure the repo root is open in VS Code
- make sure the folder is a Git repository.

### If your branch is behind

- switch to `develop`
- pull latest changes
- update your feature branch via merge or rebase depending on team preference

### If your PR picked up too many files

- inspect staged vs unstaged changes in Source Control
- split changes into smaller commits next time
- keep docs, infra, and app logic separate when possible

### If a PR is easier to review in VS Code than in the browser

That is expected — the GitHub Pull Requests and Issues extension is explicitly designed for in-editor PR browsing, checkout, and comment workflows.

---

## Companion docs

- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — comprehensive local development setup
- [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) — every variable per service
- [`docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md`](docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md) — CI/CD secrets and variables
- [`docs/technical-writing/migration-guide.md`](docs/technical-writing/migration-guide.md) — deployment and migration guide
- [`docs/migrations/naming-guide.md`](docs/migrations/naming-guide.md) — database migration naming conventions
- [`docs/API_ERROR_HANDLING.md`](docs/API_ERROR_HANDLING.md) — API error handling patterns and standards
- [`docs/arch/evaluation/db-package-evaluation.md`](docs/arch/evaluation/db-package-evaluation.md) — shared DB package evaluation
- [`scripts/dev-setup.sh`](scripts/dev-setup.sh) — automated local setup script
- [`docs/INDEX.md`](docs/INDEX.md) — documentation index
