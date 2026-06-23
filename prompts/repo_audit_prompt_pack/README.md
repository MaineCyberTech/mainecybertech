# Comparative Repo Audit Prompt Pack

This pack is designed for an intelligent AI coding/review agent to compare:

- **Reference repo:** `C:\temp\mainecybertechportal`
- **Current repo:** the active working repository in the agent's context

## Goals

- Perform a deep comparative audit
- Identify good implementations, efficiencies, and alignment opportunities
- Make the current repo as similar as practical to the reference repo **without breaking what already works**
- Prioritize safe, incremental convergence instead of destructive rewrites

## Recommended Run Order

1. `00_GLOBAL_OPERATOR_INSTRUCTIONS.md`
2. `01_PHASE_1_REPO_INVENTORY.md`
3. `02_PHASE_2_MAPPING.md`
4. `03_PHASE_3_STRENGTHS_EFFICIENCIES.md`
5. `04_PHASE_4_RISK_GUARDRAILS.md`
6. `05_PHASE_5_SAFE_ALIGNMENT_ROADMAP.md`
7. `06_PHASE_6_FILE_BY_FILE_CHANGE_PLAN.md`
8. `07_PHASE_7_PATCH_SET_DESIGN.md`
9. `08_PHASE_8_FINAL_RECONCILIATION.md`

## Tips

- Feed the phases one at a time for better reasoning quality.
- Preserve working behavior at all costs.
- Require the agent to distinguish between:
  - copy as-is
  - adapt conceptually
  - not worth porting
  - keep current implementation
- Use the final reconciliation phase as the repo's single source of truth.
