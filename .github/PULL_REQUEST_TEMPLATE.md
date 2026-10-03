## Summary

<!-- What changed and why? Link related issues or audit findings. -->

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
- [ ] No secrets, credentials, or real environment values committed
- [ ] Docs/`AGENTS.md` updated if counts, workflows, or architecture changed
- [ ] Required checks green (see `branch-protection/README.md`)
