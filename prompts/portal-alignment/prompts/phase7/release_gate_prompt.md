# PHASE 7 — RELEASE GATE

## Objective

Compute a readiness score and make a go/no-go release decision based on all prior phase findings.

## Scope

IN: engine/outputs/remediation_plan.json
OUT: engine/outputs/release_decision.json

## Scoring Formula

```
base_score = 100
P0_penalty = count(P0) * 25
P1_penalty = count(P1) * 10
P2_penalty = count(P2) * 3
P3_penalty = count(P3) * 1

readiness_score = max(0, base_score - total_penalty)
```

## Decision Rules

- **BLOCKED** (score < 70 or any P0 unresolved): deployment must not proceed
- **CONDITIONAL** (score 70-89, no P0): deployable with documented caveats
- **APPROVED** (score 90+): clear for production deployment

## Output Format (`engine/outputs/release_decision.json`)

```json
{
  "version": "3.0",
  "generated_at": "<ISO8601>",
  "git_ref": "current commit hash",
  "readiness_score": 91,
  "decision": "APPROVED|CONDITIONAL|BLOCKED",
  "summary": {
    "total_findings": 6,
    "P0": 0,
    "P1": 0,
    "P2": 3,
    "P3": 3
  },
  "blockers": ["Only populated if BLOCKED — list of P0 issues preventing release"],
  "caveats": ["Only populated if CONDITIONAL — list of caveats and known issues"],
  "recommended_remediation": "Next steps — what to fix before the next release gate"
}
```

## Severity Definitions (same as master)

- P0 = Direct data loss, cross-tenant access, auth bypass, RCE, deployment blocker
- P1 = Missing critical control, schema/contract mismatch causing runtime error
- P2 = Missing defense-in-depth, minor drift, suboptimal pattern
- P3 = Best practice, documentation gap, cosmetic

---

automation:
checks: - id: RLS-001
desc: "Verify no P0 findings are unresolved"
read: "engine/outputs/release_decision.json"
expect: "P0 count must be 0 for APPROVED or CONDITIONAL" - id: RLS-002
desc: "Readiness score is computed correctly"
read: "engine/outputs/release_decision.json"
ensure: "score matches formula: 100 - (P0*25 + P1*10 + P2*3 + P3*1)" - id: RLS-003
desc: "Decision matches score rules"
read: "engine/outputs/release_decision.json"
ensure: "decision is BLOCKED if score < 70 or P0 > 0; CONDITIONAL if 70-89; APPROVED if 90+"
