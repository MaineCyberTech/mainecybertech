# Final Risk Register, Roadmap, and Patch Plan

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** FINAL

## Consolidated Risk Register

**54 unique findings** (27 P0 Critical, 27 P1 High) aggregated from 37 audit reports.

### Top 10 P0 Critical Risks

| #   | Finding                                                          | Impact                                       | Fix                                                   |
| --- | ---------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| 1   | All entity-by-ID `GET /:id` routes lack `organization_id` filter | Cross-org data access                        | Add `.eq("organization_id", orgId)` to all 60+ routes |
| 2   | E2E + Validate + Migrations not wired as deploy gates            | Broken code reaches production               | Wire as predecessor jobs in deploy-do.yml             |
| 3   | 6 core operational docs reference dead ECS/Vercel                | Operators can't execute emergency procedures | Rewrite all 6 for DO infrastructure                   |
| 4   | No CODEOWNERS, no required status checks                         | Any contributor can merge without review     | Create CODEOWNERS + branch protection                 |
| 5   | Terraform state in git (SSH keys, VPC IDs)                       | Infrastructure secrets exposed               | Remove from git, fix backend config                   |
| 6   | Organizations list returns ALL orgs to any user                  | Org enumeration                              | Add org-scoping                                       |
| 7   | SQL injection regex blocks legitimate words                      | Form submission denial                       | Remove dictionary words from regex                    |
| 8   | Destructive routes lack requireAdmin                             | Any member can delete entities               | Add requireAdmin to DELETE/bulk routes                |
| 9   | Prometheus metrics defined but zero wired                        | No production observability                  | Wire metrics into middleware                          |
| 10  | No cookie consent banner, no privacy policy                      | GDPR non-compliance                          | Implement consent banner + privacy pages              |

## Remediation Roadmap

- **Phase 1 (Week 1):** 12 blocking items, ~19 hours
- **Phase 2 (Week 2):** 9 critical security items, ~42 hours
- **Phase 3 (Week 3):** 12 P1 high items, ~45 hours
- **Phase 4 (Week 4):** 8 quality/polish items, ~30 hours

## Patch Plan

~80 files across API, Worker, Web, CI/CD, Infrastructure, Documentation, and Configuration. See full report for per-file changes.

## Definition of Done

- [ ] 1,530+ tests pass (no regressions)
- [ ] TypeScript clean, ESLint clean
- [ ] All 27 P0 findings resolved
- [ ] All 27 P1 findings resolved
- [ ] Branch protection active with required checks
- [ ] Cookie consent + privacy policy live
- [ ] Automated daily backups
- [ ] Prometheus metrics wired
- [ ] Outbound webhook dispatcher functional
- [ ] SSO/OIDC implemented
