CI/CD SECURITY — Principal DevOps Engineer

## Scope

IN: .github/workflows/, .github/dependabot.yml
OUT: external CI runners, self-hosted infrastructure

## Review

- GitHub Actions — every workflow file, triggers, permissions
- Secrets — how secrets are injected (env vs inline), heredoc in SSH commands
- Permissions — least-privilege GITHUB_TOKEN scopes per workflow
- Branch protection — main branch rules, required checks, PR requirements
- Release safety — prod approval gates, environment protection rules
- Path filtering — workflow triggers scoped to relevant paths
- Artifact handling — job outputs, build artifacts, retention periods

## Severity Definitions

P0 = Secrets exposed in CI logs, workflow can push to prod without review
P1 = No prod approval gate, write-all token on deploy workflows
P2 = Secrets in run: commands via heredoc, no path filtering on triggers
P3 = Stale sample data in PR comments, missing retention on artifacts

## Output Format

Must conform to schemas/output_schema.json. Every finding MUST include: severity, domain="ci_cd", category, file, issue, impact, fix

---

automation:
checks: - id: CICD-001
desc: "Prod approval gate exists"
grep: "environment:._prod|prod-approval"
path: ".github/workflows/deploy-do.yml"
expect: "deploy-do.yml has environment: prod-approval for prod apply" - id: CICD-002
desc: "Secrets not in run: commands"
grep: "run:._\\${{"
path: ".github/workflows/deploy-do.yml"
expect: "secrets used via env: block, not inline in run: heredoc" - id: CICD-003
desc: "Least-privilege GITHUB_TOKEN"
grep: "permissions:"
path: ".github/workflows/"
expect: "each workflow declares explicit permissions block" - id: CICD-004
desc: "Path filtering on triggers"
grep: "paths:"
path: ".github/workflows/e2e.yml"
expect: "e2e.yml has paths: filter to avoid running on every push"
