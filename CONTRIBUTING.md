# CONTRIBUTING.md

Thank you for contributing to the Maine CyberTech Portal.

## Workflow

1. Create a feature branch from your working branch.
2. Make changes in focused, reviewable commits.
3. Update documentation when behavior, structure, or workflow changes.
4. Run local validation before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

5. If your change affects database structure or seed behavior, also validate the Supabase workflow:

```bash
supabase db reset
supabase db push
supabase db query < supabase/seed.sql
supabase db query < supabase/verify_seed.sql
```

## Pull requests

PRs should include:
- a short summary of what changed
- why the change was needed
- any migration / seed implications
- any docs updated as part of the change

## Expectations

- Keep schema changes separate from seed changes.
- Avoid committing secrets, caches, or local environment files.
- Prefer clear, explicit file organization over temporary duplicates.
- If a package or directory is placeholder-only, either document the intent clearly or remove it.
