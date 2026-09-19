SUPPLY CHAIN SECURITY — Principal Supply Chain Architect

## Scope

IN: package.json (root, apps/_, packages/_), pnpm-lock.yaml, .github/dependabot.yml,
Dockerfiles (apps/\*/Dockerfile), .dockerignore, .github/workflows/
OUT: transitive dependencies (scanned via lockfile)

## Scan

- Dependencies — outdated packages, known CVEs, deprecated libraries
- Packages — pinned versions vs caret ranges, postinstall scripts
- CI/CD artifacts — Docker layer caching, lockfile committed, image immutability
- Detect vulnerable deps — use grep for known risky packages
- Unsafe install scripts — postinstall scripts that download executables
- Docker hygiene — multi-stage builds, USER directive non-root, HEALTHCHECK

## Severity Definitions

P0 = No lockfile, unverifiable builds, known critical CVE in production dep
P1 = Missing Dependabot, no Docker layer caching, root user in container
P2 = Unpinned transitive deps, no .dockerignore, stale base images
P3 = No HEALTHCHECK in Dockerfile, warning-level CVEs

## Output Format

Must conform to schemas/output_schema.json. Every finding MUST include: severity, domain="supply_chain", category, file, issue, impact, fix

---

automation:
checks: - id: SUP-001
desc: "Lockfile committed"
glob: "pnpm-lock.yaml"
expect: "file exists and is committed" - id: SUP-002
desc: "Dependabot config exists"
glob: ".github/dependabot.yml"
expect: "file exists with npm and GHA package ecosystems" - id: SUP-003
desc: "Docker non-root user"
grep: "USER [a-z]"
path: "apps/_/Dockerfile"
expect: "each Dockerfile has USER appuser or similar non-root directive" - id: SUP-004
desc: "Docker HEALTHCHECK"
grep: "HEALTHCHECK"
path: "apps/_/Dockerfile"
expect: "each Dockerfile has HEALTHCHECK directive"
