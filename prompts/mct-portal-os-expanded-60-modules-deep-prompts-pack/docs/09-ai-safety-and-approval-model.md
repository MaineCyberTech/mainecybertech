# AI Safety and Approval Model

AI should help draft, classify, summarize, and recommend. It should not independently perform destructive or client-visible actions.

## AI draft table concept

Create a shared table such as `ai_draft_outputs` with:

- `organization_id`
- `module_key`
- `source_type`
- `source_id`
- `prompt_key`
- `prompt_version`
- `input_summary`
- `draft_output`
- `risk_level`
- `review_status`
- `reviewed_by`
- `reviewed_at`

## Approval required for

- running generated scripts
- DNS changes
- offboarding completion
- MFA/password reset execution
- client-visible publication
- risk acceptance approval
- billing change publication
- incident status publication
