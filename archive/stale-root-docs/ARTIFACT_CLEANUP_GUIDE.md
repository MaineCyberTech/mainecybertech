# Artifact Cleanup Guide

## Status Summary

###  Completed
- **.gitignore**  All artifact patterns already present (.next/, .turbo/, dist/, uild/, etc.)
- **.env.local**  Contains only local Supabase test keys (safe; localhost:54321, well-known demo tokens)
- **.env patterns**  Already in .gitignore (prevents future secrets commits)

###  Remaining (Must be removed via git history cleanup)

The following directories were committed before .gitignore patterns took effect:

| Artifact | Size | Status |
|----------|------|--------|
| \pps/web/.next/\ | ~161 MB |  Committed, needs git removal |
| \.turbo/cache/\ | ~0.05 MB |  Committed, needs git removal |
| \pps/api/dist/\ | ~0.17 MB |  Committed, needs git removal |
| \pps/worker/dist/\ | ~0.04 MB |  Committed, needs git removal |

---

## Quick Start: Git History Cleanup

### Option A: If commits NOT yet pushed to origin (simplest)

\\\ash
# Remove from git tracking (but keep locally until you rebuild)
git rm -r --cached apps/web/.next .turbo/cache apps/api/dist apps/worker/dist

# Commit the removal
git commit -m "chore: remove accidentally committed build artifacts

- Removed .next/ (Next.js build output)
- Removed .turbo/cache/ (Turbo build cache)
- Removed api/dist/ and worker/dist/ (compiled outputs)

Build artifacts are auto-generated and now properly .gitignored."
\\\

### Option B: If commits already pushed to origin

Use \fg-repo-cleaner\ or \git filter-branch\ to rewrite history (see full guide below).

---

## Full Cleanup Instructions

### Step 1: Choose Your Tool

#### Tool 1: \git filter-branch\ (safest, part of git)

\\\ash
cd /path/to/mainecybertech-portal

# Remove each artifact from all commits
git filter-branch --tree-filter 'rm -rf apps/web/.next' HEAD
git filter-branch --tree-filter 'rm -rf .turbo/cache' HEAD
git filter-branch --tree-filter 'rm -rf apps/api/dist' HEAD
git filter-branch --tree-filter 'rm -rf apps/worker/dist' HEAD

# Reclaim space
git reflog expire --expire=now --all
git gc --prune=now --aggressive
\\\

#### Tool 2: \fg-repo-cleaner\ (faster for large repos)

\\\ash
# Install bfg if needed:
# macOS: brew install bfg
# Linux: apt-get install bfg-repo-cleaner

bfg --delete-folders apps/web/.next .
bfg --delete-folders .turbo/cache .
bfg --delete-folders apps/api/dist .
bfg --delete-folders apps/worker/dist .

git reflog expire --expire=now --all && git gc --prune=now --aggressive
\\\

### Step 2: Force Push (if rewriting history)

 **Only if commits haven't merged to main/develop:**

\\\ash
git push --force-with-lease origin main
git push --force-with-lease origin develop
git push --force-with-lease origin --tags
\\\

---

## Verification Checklist

After cleanup:

- [ ] Run \git status\  should show no artifact directories
- [ ] Run \git ls-files | grep '.next\\|.turbo\\|dist/'\  should return nothing
- [ ] Run \du -sh .git\  should be noticeably smaller
- [ ] Run \pnpm install && pnpm build\  builds without errors
- [ ] Run \pnpm dev\  development server starts correctly

---

## Prevention for Future

The \.gitignore\ already covers:

\\\gitignore
.next/
.turbo/
dist/
build/
coverage/
node_modules/
\\\

Ensure developers use \git status\ before committing and never stage these directories.

---

## Environment Recovery

After cleanup, regenerate local environment:

\\\ash
# Install deps
pnpm install

# Start Supabase locally
pnpm supabase:start

# Sync environment
pnpm supabase:env:sync

# Rebuild all packages
pnpm build

# Start dev server
pnpm dev
\\\

---

## Related: Secrets Audit

The analysis also reviewed secrets. Current status:

-  **.env.local**  Contains ONLY local test keys (safe; localhost keys)
-  **Git history**  Should audit past commits for accidentally committed production secrets

To search history:

\\\ash
# Search for potential secret patterns
git log -p -S "SUPABASE_SERVICE_ROLE_KEY" | head -50
git log -p -S "JWT_SECRET" | head -50
\\\

---

## Questions?

Refer to:
- \docs/INDEX.md\ — Documentation index
- \docs/README.dev.md\  Local development guide
- \CONTRIBUTING.md\  Contribution guidelines