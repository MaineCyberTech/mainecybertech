# Integration Guide

## Step 1: Run Hardening Prompts

security → data → resilience → observability → supply_chain → privacy → ci_cd → evolution

## Step 2: Merge Findings

Use global_merger to combine all JSON outputs

## Step 3: Reconcile

Run reconciliation prompt to normalize and dedupe

## Step 4: Compute Risk

Run global_risk_engine to compute:

- P0 count
- P1 count
- global score

## Step 5: Feed Outputs

Use outputs for:

- CI gating
- dashboards
- auto remediation

## Outputs Produced

- global_findings.json
- reconciled_findings.json
- system_risk_score.json
