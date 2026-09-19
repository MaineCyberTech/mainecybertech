# Prompt Pack Provenance (P2-1)

The `prompts/` directory contains 787 files across 6 packs — prompt templates
for AI-assisted development AND generated audit outputs (JSON/CSV/py artifacts)
produced by running those audits. Because these files are not executable in the
application runtime, but ARE committed to the repo and could be tampered with,
they represent a **supply-chain risk**: a malicious or accidental edit could
inject instructions or fabricated findings that influence future AI-assisted
development or decisions.

## Supply-chain posture

1. **No runtime execution.** Nothing in `prompts/` is imported by the
   application servers (`apps/api`, `apps/web`, `apps/worker`) or built into
   images. Verify with:
   ```bash
   grep -ri "prompts/" apps/ packages/ --include="*.ts" --include="*.js"
   ```

2. **Cryptographic pinning.** Every file is hashed (SHA-256) and recorded in
   `prompts/manifest.json`. Per-pack tree hashes are computed over
   `path\0content`, so changing any file changes its pack's hash.

3. **CI guard.** The `validate` workflow (a deploy gate) runs
   `node scripts/verify-prompts.js verify`, which fails the pipeline on any
   missing / added / changed file under `prompts/`. This is a deploy gate, so a
   tampered prompt file blocks deployment.

4. **Review-before-regenerate.** Intended changes to prompt/audit files are
   reviewed via normal PR review, then the author regenerates the manifest:
   ```bash
   node scripts/verify-prompts.js generate
   ```

## Usage

```bash
node scripts/verify-prompts.js generate   # update prompts/manifest.json after intended changes
node scripts/verify-prompts.js verify     # check files match manifest (run in CI)
node scripts/verify-prompts.js tree       # print per-pack SHA-256 tree hashes
```

## Pack inventory

| Pack | Files | Tree hash (generated) | Purpose |
| ---- | ----- | --------------------- | ------- |
| `hardening_prompt_pack` | 70 | 5e7fe33c… | Security/hardening audit + remediation prompts |
| `mct-full-webstore-product-catalog-pack` | 193 | 6bbf6d77… | Webstore product catalog prompts |
| `mct-portal-os-expanded-60-modules-deep-prompts-pack` | 222 | 0c90b9a5… | 60-module portal OS deep prompts |
| `portal-alignment` | 63 | 33d35be0… | Portal alignment prompts |
| `repo-deep-dive` | 210 | 2bcf19a1… | Repo deep-dive prompts |
| `repo_audit_prompt_pack` | 28 | 6a7c5d47… | Repo audit prompts |

> Tree hashes above are the values as of the last `generate`. The authoritative
> values live in `prompts/manifest.json` and are verified by CI.
