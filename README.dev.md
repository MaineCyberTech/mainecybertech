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
- Terraform root: `infra/terraform`
- backend config: `env/backend.dev.hcl`
- var file: `env/dev.tfvars`
- expected deployment branch: `develop`

#### Production

- app hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- Terraform root: `infra/terraform`
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
- **Docker** (for local stack via `infra/digitalocean/docker-compose.yml`)
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

VS Code uses the Git installation on your machine, and the official VS Code docs explicitly state that Git support is built in but depends on your local Git installation. Those same docs also recommend configuring your Git username and email before committing. citeturn17search67

Run these once:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

The official Git tutorial also documents the standard first-time flow of initializing a repository, adding files, and committing them. citeturn17search54

If you ever need to initialize a local folder as a Git repository:

```bash
git init
git add .
git commit -m "Initial commit"
```

---

## Cloning or opening the repo in VS Code

The official VS Code source control docs explicitly say you can start by opening an existing Git repository, cloning one, or initializing one from the current folder. citeturn17search67

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

Once open, VS Code should detect the repository and enable Source Control automatically. The official VS Code docs state that when you open a folder that is already a Git repository, VS Code activates its Git source control features. citeturn17search67

---

## Using Git inside VS Code

The official VS Code source control docs explicitly state that you can use the Source Control UI for staging, committing, creating branches, handling merge conflicts, and other Git operations directly inside the editor. citeturn17search67

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

The official **GitHub Pull Requests and Issues** extension listing states that the extension supports authenticating to GitHub, listing and browsing PRs, reviewing PRs with in-editor commenting, and checking out PRs directly in VS Code. citeturn17search61

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

Your final infrastructure model uses Terraform rooted at `infra/terraform`, with separate files for testing/dev and production. That environment split was already established in the Terraform bundles you generated earlier, with:

- `env/backend.dev.hcl`
- `env/backend.prod.hcl`
- `env/dev.tfvars`
- `env/prod.tfvars` citeturn12file44

### Expected environment files

Inside `infra/terraform/env/`, you should have:

```text
env/
├── dev.tfvars
├── prod.tfvars
├── backend.dev.hcl
└── backend.prod.hcl
```

### What they do

- `dev.tfvars` → testing/dev values such as testing domains and testing ECS targets
- `prod.tfvars` → production values such as production domains and production ECS targets
- `backend.dev.hcl` → points Terraform at the testing/dev state backend
- `backend.prod.hcl` → points Terraform at the production state backend

### Important rule

Never mix dev backend config with prod tfvars, or prod backend config with dev tfvars.

---

## How to run the app locally

Your current GitHub workflow set shows that the repo’s CI jobs use **pnpm** for workspace install/build/lint/test flows in the generated workflow pack, while your original uploaded snippets showed only the initial checkout steps for build/lint/test. The final workflow bundle completed that pattern using `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, and `pnpm test`. citeturn14file51turn13search47turn13search49turn13search48

### Recommended local start sequence

From the repo root:

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

### Web app local workflow

The final web workflows target `apps/web`, and the preview workflow validates the web app build from that location. citeturn14file51turn13search53

A reasonable contributor pattern locally is:

```bash
pnpm --filter web build
```

If your local scripts include a dev server, run that from the repo root or `apps/web` depending on how your package scripts are defined.

### Terraform local validation

If you modify infrastructure, validate locally before opening a PR:

```bash
cd infra/terraform
terraform fmt -recursive
terraform validate
```

### Environment-specific Terraform commands

#### Dev / testing

```bash
cd infra/terraform
terraform init -backend-config=env/backend.dev.hcl
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

#### Production

```bash
cd infra/terraform
terraform init -backend-config=env/backend.prod.hcl
terraform plan -var-file=env/prod.tfvars
terraform apply -var-file=env/prod.tfvars
```

Those dev/prod backend and tfvars patterns are the same environment split established in your final Terraform-root and deployment-handbook bundles. citeturn12file44turn15file52

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
cd infra/terraform
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

The final workflow bundle you generated includes a complete validation layer with:

- `build.yml`
- `lint.yml`
- `test.yml`
- `web-preview.yml` citeturn14file51

So once you open a PR, the expected validation path is:

1. workspace build validation
2. lint validation
3. test execution
4. web preview build validation if web files changed
5. Terraform plan if infra files changed and the PR targets `develop` or `main` using the environment-specific plan workflows. citeturn14file51turn15file52

This means contributors should expect PRs to be the first official gate after local work.

---

## How changes move to testing/dev

Your final workflow bundle defines a testing/dev lane based on the `develop` branch using:

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

Your final workflow bundle defines the production lane based on `main` using:

- `terraform-do.yml` (DigitalOcean infrastructure, gated by `prod-approval` environment)
- `deploy-do.yml` (Build 3 GHCR images + SSH deploy to production droplet)
- `supabase-migrations.yml` (runs as deployment gate)

### Practical meaning

When tested changes are promoted and merged into `main`:

- Terraform applies against the **production DigitalOcean backend** and **production tfvars**
- The web app, API, API, and worker deploy to the **production DO droplet** behind Caddy via `deploy-do.yml`
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

Your final deployment model recommends creating two GitHub Environments:

- `dev`
- `prod` (with required reviewers for `prod-approval` gate)

### Secrets needed

The final workflow and deployment documentation consistently call for:

- `DO_TOKEN` (DigitalOcean API token for Terraform)
- `CLOUDFLARE_API_TOKEN`
- `TF_VAR_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `SSH_PRIVATE_KEY` (for `deploy-do.yml` droplet access)
- `GHCR_TOKEN` (for pushing images to GitHub Container Registry)

### Variables needed

And for environment-specific variables:

- `DO_REGION`
- `DO_DROPLET_SIZE`
- `DO_SSH_KEY_FINGERPRINT`
- `CLOUDFLARE_ZONE_ID_PROD`
- `CLOUDFLARE_ZONE_ID_DEV`
- `TF_BACKEND_CONFIG`
- `TF_VAR_FILE`

### Recommended environment-scoped values

#### `dev`

- `TF_BACKEND_CONFIG=env/backend.dev.hcl`
- `TF_VAR_FILE=env/dev.tfvars`
- values point to testing/dev cluster/services/repos. citeturn14file51turn15file52

#### `prod`

- `TF_BACKEND_CONFIG=env/backend.prod.hcl`
- `TF_VAR_FILE=env/prod.tfvars`
- values point to production cluster/services/repos. citeturn14file51turn15file52

---

## Recommended contributor-safe habits

### 1. Never work directly on `main`

Always start from `develop` and create a feature branch.

### 2. Review diffs before committing

Use VS Code’s Source Control diff view before every commit. The official VS Code docs explicitly describe the integrated diff/editor view as part of normal source-control use. citeturn17search67

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
- make sure the folder is a Git repository. citeturn17search67

### If your branch is behind

- switch to `develop`
- pull latest changes
- update your feature branch via merge or rebase depending on team preference

### If your PR picked up too many files

- inspect staged vs unstaged changes in Source Control
- split changes into smaller commits next time
- keep docs, infra, and app logic separate when possible

### If a PR is easier to review in VS Code than in the browser

That is expected — the GitHub Pull Requests and Issues extension is explicitly designed for in-editor PR browsing, checkout, and comment workflows. citeturn17search61

---

## Recommended companion docs to keep in the repo

For the cleanest contributor/operator experience, keep this file alongside:

- local development checklist
- VS Code Git quickstart
- final deployment operations handbook
- production cutover checklist
- GitHub secrets and variables matrix
- Terraform environment file guide

That gives contributors one path for development and operators one path for deployment.
