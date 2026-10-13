## Summary

<!-- What changed and why? Link related issues or audit findings. -->

## AI assistance (optional, AI-P3-007)

<!-- If AI assisted this change, name the tool/model and the human owner who
     reviewed it, e.g. `AI: opencode/deepseek-v4.1-flash; reviewed by @owner`.
     Agents must not self-approve or merge. -->

## Testing

<!-- Commands run and results, e.g. `pnpm --filter=api test`, `pnpm e2e`. -->

## Checklist

- [ ] Unit tests added/updated for behavior changes (`pnpm test`)
- [ ] Lint and typecheck pass (`pnpm lint`, `pnpm typecheck`)
- [ ] OpenAPI spec regenerated if API routes changed (`pnpm --filter=api generate:openapi` + `pnpm --filter=api exec tsx src/scripts/validate-openapi.ts`)
- [ ] Prompt provenance unaffected (`node scripts/verify-prompts.js verify`)
- [ ] `review.md` mirror stays in sync (`node scripts/sync-review-md.mjs --check`)
- [ ] Supabase migrations are idempotent and follow the naming guide (if any)
- [ ] `CHANGELOG.md` `[Unreleased]` updated (or N/A for docs-only)
- [ ] No secrets, credentials, or real environment values committed (if one is found, follow [`docs/SECRETS_ROTATION.md`](../docs/SECRETS_ROTATION.md))
- [ ] Docs/`AGENTS.md` updated if counts, workflows, or architecture changed
- [ ] Required checks green (see `branch-protection/README.md`)
