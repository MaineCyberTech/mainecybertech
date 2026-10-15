# 01_repository_inventory — Prompt 01 - Comprehensive Repository Inventory

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `01_repository_inventory.md` (area INV, prompt)

## Verification Performed

Domain subagent produced 9 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| INV-P2-001 | P2 | Committed generated artifacts drift without a gate |
| INV-P2-002 | P2 | Duplicate schema bootstrap SQL can be mistaken for the source of truth |
| INV-P3-001 | P3 | Large committed prompt/audit corpus inflates the application repository |
| INV-P3-002 | P3 | Stale, machine-specific repo path in the agent reference |
| INV-P3-003 | P3 | Committed build artifact apps/web/public/version.json is stale and unguarded |
| INV-P3-004 | P3 | Vestigial Vercel deploy configs remain after the DigitalOcean migration |
| INV-P3-005 | P3 | Previous-run audit artifacts are amended in place without rebinding to the commit they now reflect |
| INV-P3-006 | P3 | Committed Supabase Studio scratch snippet duplicates a dev seed |
| INV-P3-007 | P3 | Service worker asset apps/web/public/sw.js is not registered anywhere |
