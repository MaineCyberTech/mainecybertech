# AI Automation and Agent Readiness Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20261002-0344-develop-6286137
- Repository: C:\temp\mainecybertech
- Branch: develop
- Commit SHA: 62861370 (`6286137017c4b7c77e83ee420ec11382d984f263`, read from `.git/refs/heads/develop`; `git` CLI not available in the audit shell)
- Generated at: 2026-10-02 03:44 UTC (run scaffold) / report authored 2026-10-02
- Auditor: principal-level repository auditor (subagent, prompt 20)
- Area code: AI
- Output path: docs/audits/repo-deep-dive/20261002-0344-develop-6286137/20_ai_automation_agent_readiness.md
- Scope limitations:
  - Static, read-only analysis of the working tree at the commit above. `git`, `node`, `pnpm` and `python` are not on `PATH` in this audit shell, so no test suite, manifest verifier, or docs-count guard was executed end-to-end. Every "reproduced" claim below means reproduced from the checked-out files using file reads and hashing, not by running the tooling.
  - No GitHub-side verification (branch-protection enforcement, environment protection rules, secret presence) — only the committed `.github/branch-protection/*.json` and workflow files.
  - The prior audit at `prompts/repo-deep-dive/20260730-0650-develop-62da92c/20_ai_automation_agent_readiness.md` was audited against a *different* repository path (`C:\temp\mainecybertech-portal`) and answered a different question (MCP/OpenAPI/API-key readiness). It is treated as historical context only and is **not** carried forward; conclusions here are re-derived at the current commit.
  - The external pack at `C:\temp\repo-deep-dive` is used **only** as a drift reference for the vendored `prompts/` copies; it is not part of the audited repository.

## Scope

Reviewed (agent-readiness interpretation of prompt 20, per the brief):

- Agent instruction files: `AGENTS.md`, the generated mirror `review.md`, `CONTRIBUTING.md`, `docs/testing.md`, `docs/CI.md`, `docs/RELEASING.md`, `docs/INDEX.md`, `.github/PULL_REQUEST_TEMPLATE.md`.
- Editor/agent configs: `.continue/agents/config.yaml`, `.vscode/*`, `.husky/pre-commit`. Confirmed absence of Cursor/Windsurf/Copilot/Claude/`opencode.json`/MCP config.
- The four vendored audit prompt packs under `prompts/`: `hardening_prompt_pack`, `portal-alignment`, `repo_audit_prompt_pack`, `repo-deep-dive` — instruction currency, embedded generated outputs, provenance pinning (`prompts/manifest.json`, `prompts/PROVENANCE.md`, `scripts/verify-prompts.js`).
- Safe-change boundaries and gates: `.github/workflows/*.yml` (16), `.github/CODEOWNERS`, `.github/branch-protection/{develop,main}.json`, lint-staged config, docs-count/link guards, prompt-provenance gate, `review.md` sync gate.
- Secrets guidance and PR guidance: `.env.example` files, PR template checklist, `SECURITY.md` reference.
- Generated-artifact risk: `packages/sdk/src/database.types.ts` provenance, embedded JSON/py outputs inside `prompts/`, `docs/openapi.yaml`.

Not reviewed: runtime behavior of the application, live GitHub settings, the external pack itself, or non-audit prompt packs (`mct-portal-os-*`, `mct-full-webstore-*`) beyond their existence as part of the `prompts/` count.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `AGENTS.md` (816 lines) | Agent instructions | Primary agent contract; every agent reads this first | Repo path, counts, gates, do-not-touch rules |
| `review.md` (generated mirror) | Agent instructions | CI-checked copy of AGENTS.md consumed by reviewers/agents | 113,254-char body identical to AGENTS.md after the generated header |
| `scripts/sync-review-md.mjs`, `scripts/check-docs-counts.mjs` | Guard scripts | Enforce mirror sync and doc-count parity in CI | `validate.yml` + `test.yml` steps |
| `.continue/agents/config.yaml` (19 lines) | Agent config | Only Continue config present | Models only — no `rules`/`prompts`/`context`/MCP |
| `.github/workflows/*.yml` (16) | CI gates | What actually blocks an agent's PR/deploy | Pinned SHAs, corepack retry, guards |
| `.github/CODEOWNERS` | Governance | Who must review which paths | Team handles only; no per-file owners |
| `.github/branch-protection/develop.json`, `main.json` | Governance | Required checks + review counts | develop: 3 checks; main: 5 checks; `enforce_admins:false` |
| `prompts/manifest.json` (787 files pinned) | Provenance | Cryptographic pin of every prompt/audit file | `generatedAt` 2026-08-27; sha256 per file + per-pack |
| `prompts/PROVENANCE.md` | Provenance doc | States supply-chain posture + pack inventory | Describes packs as AI-dev templates |
| `prompts/repo-deep-dive/**` (43 prompt files) | Prompt pack | The pack this run executes | Missing prompt `45`; prompt `20` differs from external |
| `prompts/hardening_prompt_pack/README.md` | Prompt pack | Advertised runner/paths | References `runner/harden_run_all.py`, `runner/outputs/` |
| `prompts/portal-alignment/README.md` | Prompt pack | Advertised engine/paths | `engine/run_alignment_engine.py`, phase outputs |
| `prompts/repo_audit_prompt_pack/**` (28) | Prompt pack | 8-phase repo audit prompts + two stale runs | `Run1/`, `Run2/` embedded outputs |
| `docs/audits/README.md`, `docs/audits/.../audit_manifest.json`, `INDEX.md` | Audit convention | The output contract agents follow | Run manifest lists prompt `45` (absent) |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR guidance | Agent PR checklist | Includes provenance + review.md sync checks |
| `apps/*/.env.example`, `infra/digitalocean/.env.example` | Secrets guidance | Placeholder hygiene | All values placeholders/URLs; no secret material |
| `docs/CI.md`, `docs/testing.md`, `docs/RELEASING.md` | Dev/ops docs | Validation commands an agent will run | A11y route count stale in 3 docs |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| HEAD read from `.git/refs/heads/develop` | Repo state | Bind report to a commit | `6286137017c4b7c77e83ee420ec11382d984f263` = `62861370`; branch `ref: refs/heads/develop` |
| Counted `prompts/` recursively | Aggregate | Check `AGENTS.md` "789 prompt files / 6 packs" | **789** files on disk; packs = 6 directories → **supported** |
| Parsed `prompts/manifest.json` | Self-consistency | Verify pin covers the tree | `fileCount: 787`; excludes `manifest.json` + `PROVENANCE.md` (matches `verify-prompts.js` filter) → 789−2 = 787 → **supported** |
| Re-hashed 8 sampled prompt files (LF-normalized sha256) vs manifest | Binding | Verify pin is not stale after 2026-10-01 checkout mtimes | All 8 **MATCH** (incl. prompt `20`, shared rules, all four pack READMEs) |
| Counted route/sdk/worker/migration/seed/workflow/page files | Aggregate | Verify `AGENTS.md` File-Counts table | 62 top-level routes (75 recursive), 60 SDK, 13 worker task files, 127 migrations (latest `5302428`), 9 seeds, 16 workflows, 319 pages — all **supported** |
| Counted test files per package | Aggregate | Verify "3,490 tests / 397 suites" | API 114, Web 271, SDK 3, Worker 9 suites = 397; rows sum 1258+1832+296+104 = 3,490 → internal total **supported** (test *count* not executable here) |
| Counted `apps/web/e2e/a11y.spec.ts` `BASE_PAGES`/`FULL_PAGES` | Reproduce | Verify "25 pages" default gate vs docs | BASE = **25**, FULL = **43**, total **68** → `AGENTS.md` "25" **supported**; `docs/testing.md`/`docs/WEB_UI_CONVENTIONS.md`/`docs/CI.md` "19" **unsupported** |
| Read `scripts/check-docs-counts.mjs` | Self-consistency | Does the guard cover the stale number? | Guard covers components/tests/pages/routes/workflows/scripts/migrations/prompts/RLS — **not** a11y route count → drift unguarded **supported** |
| Compared `AGENTS.md` vs `review.md` bodies | Binding | Mirror sync gate | Byte-identical after header → **supported** |
| Compared vendored `prompts/repo-deep-dive/prompts/**` to external `C:\temp\repo-deep-dive\prompts\**` | Drift | Is the pack current? | External 49 vs vendored 43; missing prompts `41–45` + `MASTER_RUNNER_FALCON_LAB.md` → **unsupported** (vendored is an older pack) |
| Diffed prompt `20` (external vs vendored) | Drift | Instruction currency | sha256 differs (`6267CFBD…` vs `83FD53E7…`) → **unsupported** |
| Resolved run `audit_manifest.json` executionOrder (42) against vendored pack | Reproduce gate | Can the listed run actually execute? | Lists `45_exploit_chain_attack_path_audit.md`, which is **absent** in vendored pack → **unsupported** |
| Grepped `.env.example` for secret-like values | Secrets | Placeholder hygiene | No `sk_/eyJ/AKIA/ghp_/xox/whsec_/BEGIN KEY`; flagged hits were URLs/hosts → **supported** |
| `Test-Path` for `.cursor*`, `.windsurfrules`, `.github/copilot-instructions.md`, `CLAUDE.md`, `opencode.json`, MCP configs | Inventory | Enumerate agent configs | All absent → only `.continue/agents/config.yaml` → **supported** |
| `Test-Path` for `apps/api/src/lib/auth.ts`, `lib/supabase.ts` | Stale paths | Verify AGENTS-flagged drift | Absent; `middleware/auth.ts` + `services/supabase.ts` present → stale references still live in embedded prompt outputs → **supported** |

### Claim adjudication (headline claims)

| Claim | Source | Outcome |
|---|---|---|
| "3,490 tests, all passing. 397 suites." | `AGENTS.md:39` | **partially supported** — suite counts reproduced exactly; total is arithmetically consistent; "all passing" not reproducible (no runner). |
| "AI prompt files 789 (6 packs)" | `AGENTS.md:104` | **supported** — 789 files, 6 pack directories. |
| "manifest.json pins SHA-256" + `validate.yml` deploy gate | `PROVENANCE.md`, `validate.yml:185-195` | **supported** — pin present, gate present, samples match. |
| Default a11y gate "25 pages" | `AGENTS.md:58` | **supported** — `BASE_PAGES` = 25. |
| Default a11y gate "19 core routes" | `docs/testing.md:66`, `docs/WEB_UI_CONVENTIONS.md:87`, `docs/CI.md:13,56` | **unsupported** — spec has 25 in the default gate. |
| Repo path `C:\temp\mainecybertech-portal` | `AGENTS.md:3` | **unsupported** — current working tree is `C:\temp\mainecybertech`. |
| Run manifest/prompt list is runnable | `docs/audits/.../audit_manifest.json:46`, `.../INDEX.md:55` | **unsupported** — references prompt `45`, absent in the vendored pack. |
| Vendored `repo-deep-dive` pack is the current pack | `prompts/repo-deep-dive/` | **unsupported** — it is an older edition than the external v1.4.1 pack. |
| Branch protection covers `develop` + `main` | `AGENTS.md:631-636`, `.github/branch-protection/*.json` | **partially supported** — JSON is committed with required checks; actual application to GitHub and `enforce_admins:false` not verifiable here. |

## Executive Summary

**The repository is unusually well-instrumented for AI-agent safety on the *gates* axis, but its *agent-facing documentation and vendored prompt packs have drifted from the code and from each other.** The strongest assets are real and CI-enforced: a single `AGENTS.md` mirrored byte-for-byte into `review.md` and guarded by `scripts/sync-review-md.mjs --check`, a SHA-256 provenance pin over all 787 prompt/audit files (`prompts/manifest.json`) enforced as a deploy gate in `validate.yml`, CODEOWNERS coverage, committed branch-protection JSON requiring 1 review + status checks, lint-staged running ESLint **and** Prettier on staged files, and a pre-commit secret scanner. An agent cannot land a change to `prompts/` or `AGENTS.md`/`review.md` without tripping a blocking gate.

**The risks are concentrated in three places:**

1. **Vendored audit prompt packs are stale and partly non-executable.** The repo vendors `repo-deep-dive` at an edition **older** than the current external pack: it is missing prompts `41–45` (including `45_exploit_chain_attack_path_audit.md`) and its prompt `20` differs from the current source. Worse, the *run scaffold itself* (`docs/audits/…/audit_manifest.json` and `INDEX.md`) lists prompt `45` in its 42-step execution order — so the audit tooling this repo runs points at a prompt the vendored pack does not contain. Two of the other three packs (`hardening_prompt_pack`, `portal-alignment`) advertise runner/engine scripts and output directories that do not exist in the vendored tree (e.g. `runner/harden_run_all.py`, `runner/outputs/`), and the current external pack declares those two packs **retired** — yet the repo carries them as live "AI-assisted development" templates.
2. **Doc drift that agents will trust.** `AGENTS.md` still names the old repository path, and three developer docs (`docs/testing.md`, `docs/WEB_UI_CONVENTIONS.md`, `docs/CI.md`) state the default a11y gate scans "19 core routes" when the spec runs 25. The docs-count guard does not cover this number, so it drifts silently — an agent updating a page or a test will read a wrong boundary.
3. **No agent-specific guardrail layer.** The only agent config (`.continue/agents/config.yaml`, 19 lines) defines two models and nothing else — no `rules`, no `context` providers, no do-not-touch list, no MCP allow/deny. Safe-change boundaries exist only as prose in `AGENTS.md` and as CI gates; there is no machine-enforced statement of which paths an agent may modify, which actions require human approval, or how much may change per PR. Prompt-injection surface is real: `prompts/` contains hundreds of embedded generated JSON/markdown outputs (finding registers, audit reports, Python scripts) that an agent may read as instructions.

**Recommended next actions (priority order):** (AI-P1-001) re-sync or clearly mark the vendored prompt packs, and reconcile the run manifest's prompt list with what the pack actually contains; (AI-P1-002) fix the stale repository path and a11y count and extend `check-docs-counts.mjs` to guard them; (AI-P2-001) add a short, machine-checkable agent guardrails section (allowed paths, human-approval actions, max PR size) to `AGENTS.md` and, if Continue is used, to `.continue/`.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Agent instruction file | `AGENTS.md` | Single agent contract (architecture, counts, gates, debt) | Present, rich, CI-guarded for counts | Medium | Stale repo path line 3 |
| Generated mirror | `review.md` | Reviewer/agent copy of AGENTS.md | In sync (byte-identical body) | Low | Guard: `sync-review-md.mjs --check` |
| Continue config | `.continue/agents/config.yaml` | Model config for Continue | 19 lines, models only | Medium | No rules/context/allow-list |
| Cursor/Windsurf/Copilot/Claude configs | — | Editor agent configs | None present | Low | Confirmed absent |
| MCP / OpenCode config | — | Tool-server allow/deny | None present | Low | Confirmed absent |
| Repo-deep-dive pack | `prompts/repo-deep-dive/` | This audit's prompt pack | 43 files; **older** than source; missing `41–45` | High | Run manifest lists `45` |
| Hardening pack | `prompts/hardening_prompt_pack/` | 8-domain hardening prompts + engine | 70 files; README references absent runner paths; declared retired upstream | Medium | Embedded `*.py`/JSON outputs |
| Portal-alignment pack | `prompts/portal-alignment/` | 7-phase alignment engine | 63 files; README references `engine/run_alignment_engine.py` (present) but dashboard/trend engines partly stale; declared retired upstream | Medium | Embedded outputs hardcode old repo path |
| Repo-audit pack | `prompts/repo_audit_prompt_pack/` | 8-phase repo audit | 28 files incl. two embedded runs (`Run1`, `Run2`) | Low | Historical outputs only |
| Provenance manifest | `prompts/manifest.json` | SHA-256 pin of 787 files | In sync for sampled files | Low | `generatedAt` 2026-08-27 |
| Provenance doc | `prompts/PROVENANCE.md` | Posture + pack inventory | Accurate to pin | Low | Describes packs as AI-dev templates |
| Provenance gate | `validate.yml` `prompt-provenance` job | Blocks deploy on prompt drift | Present (blocking) | Low | `verify-prompts.js verify` |
| Docs-count guard | `scripts/check-docs-counts.mjs` | Blocks doc-count drift | Present; **no a11y coverage** | Medium | Gap below |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` | Agent PR checklist | Present, includes gates | Low | |
| CODEOWNERS | `.github/CODEOWNERS` | Path ownership | Present, team handles | Low | `require_code_owner_reviews:false` |
| Branch protection JSON | `.github/branch-protection/*.json` | Required checks/reviews | Committed (develop 3 checks, main 5) | Medium | `enforce_admins:false` |
| Pre-commit hook | `.husky/pre-commit` | Secret scan + lint-staged | Present | Low | `scan-secrets.sh` + `lint-staged` |
| Secrets guidance | `apps/*/.env.example`, `infra/.../.env.example` | Placeholders | Placeholder/URL values only | Low | No secret material |
| Generated types | `packages/sdk/src/database.types.ts` | Generated DB types | Generated; guarded by `generate-db-types.js --check` | Low | Committed generated artifact |

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Agent instructions | 4 | `AGENTS.md` comprehensive + `review.md` mirror + counts guard | Stale repo path; no guardrails/approval matrix; no do-not-touch list as structured data | Fix path; add guardrails section (AI-P1-002/AI-P2-001) |
| Copilot/Cursor/Windsurf/Claude configs | 1 | None present; only `.continue/agents/config.yaml` (models only) | Continue config has no rules/context; other editors unconfigured | Add rules/context to Continue or document intentional absence |
| Prompt packs | 2 | 4 packs vendored, provenance-pinned | `repo-deep-dive` stale (missing 41–45); 2 packs declared retired-but-vendored; broken internal path references | Re-sync or mark retired; fix READMEs (AI-P1-001) |
| Repo maps | 3 | `docs/INDEX.md`, `docs/module-matrix-mapping.md`, AGENTS architecture table | Some embedded maps reference old repo path (`mainecybertech-portal`) | Regenerate maps; note historical outputs are historical |
| Conventions | 4 | `docs/WEB_UI_CONVENTIONS.md`, `docs/testing.md`, `docs/CI.md`, AGENTS Code Patterns | A11y count stale in 3 docs | Guard the number; correct docs (AI-P1-002) |
| Validation commands | 4 | AGENTS "Running tests", `docs/RELEASING.md` gate list, PR template commands | `pnpm e2e`/stack commands not runnable headless in audit; docs internally consistent otherwise | Add "what runs in CI vs locally" note |
| Safe-change boundaries | 3 | Prose in AGENTS/PROVENANCE/PR template; CI gates enforce on push | No machine-enforced allow/deny; no max-batch rule; boundaries rely on agent reading prose | Add guardrails section + small-batch rule (AI-P2-001) |
| Do-not-touch areas | 2 | AGENTS "do not re-add NODE_ENV=test bypasses"; PR template "no secrets" | No enumerated do-not-touch path list; generated files not flagged as do-not-hand-edit (except database.types via .prettierignore) | Add explicit do-not-touch list |
| Secrets guidance | 4 | `.env.example` placeholders; pre-commit `scan-secrets.sh`; AGENTS env sections | Guidance is in AGENTS/PROVENANCE prose; no dedicated SECURITY secrets runbook section cited in instructions | Link secrets runbook from AGENTS |
| PR guidance | 4 | PR template checklist + CONTRIBUTING + RELEASING | No explicit "small-batch PR" size rule; no agent/author disclosure line | Add size + provenance disclosure (AI-P2-001) |
| Audit output conventions | 3 | `docs/audits/README.md` contract + scaffolded run | Run manifest/INDEX list a prompt the pack lacks; contract vs scaffolding drift | Reconcile manifest/prompt list (AI-P1-001) |
| Generated code risks | 4 | Provenance pin; DB-types guard; `.prettierignore` for generated file; DOC note in AGENTS | Embedded prompt-pack outputs are unlabeled as historical and mix generated reports with instructions | Mark embedded outputs as non-instructions (AI-P2-002) |

## Detailed Review

### Item: Agent instruction file (`AGENTS.md` + `review.md`)

- Evidence: `AGENTS.md` (816 lines), `review.md` (generated header + identical body), `scripts/sync-review-md.mjs`, `scripts/check-docs-counts.mjs`.
- What it does: Defines architecture, file counts, test status, CI/CD, code patterns, an audit remediation ledger, and Known Debt. `review.md` is a generated copy consumed by reviewers/agents.
- How it appears to work: `AGENTS.md` is the source of truth; `sync-review-md.mjs` regenerates `review.md`; `check-docs-counts.mjs` fails CI when declared counts drift from the filesystem; `validate.yml` runs `sync-review-md.mjs --check`.
- Dependencies: Node tooling in CI; the counts guard imports `collectRlsStats` from `verify-rls.mjs`.
- Current controls: Counts guard + mirror-sync gate + PR-template reminder to update AGENTS.md.
- Missing controls: No check that the **repo path** in line 3 is current; no check on the a11y route count; no structured "allowed/forbidden paths" list; no human-approval matrix.
- Risks: Agents may trust a stale path; agents may size PRs and touch paths without a machine-readable boundary.
- Recommended improvement: Fix the path; add an "Agent guardrails" section (allowed paths, approval-required actions, max files/PR); extend the counts guard to a11y routes.
- Suggested tests: Extend `check-docs-counts.mjs` with an a11y `BASE_PAGES` count assertion; add a `sync-review-md.mjs --check` negative test.
- Suggested docs: Update `AGENTS.md`, `docs/testing.md`, `docs/CI.md`, `docs/WEB_UI_CONVENTIONS.md`.

### Item: Continue / editor agent configuration

- Evidence: `.continue/agents/config.yaml` (19 lines), absence of `.cursor*`, `.windsurfrules`, `.github/copilot-instructions.md`, `CLAUDE.md`, `opencode.json`.
- What it does: Configures two local models (LM Studio chat/edit; Ollama autocomplete) via `provider`/`apiBase`.
- How it appears to work: Continue reads the config for model roles; nothing else is defined.
- Dependencies: Local LM Studio (`localhost:1234`) and Ollama (`localhost:11434`).
- Current controls: None in the config.
- Missing controls: No `rules`/`prompts`/`context` providers; no mention of `AGENTS.md`; no tool/MCP allow-list; no model-output trust boundary.
- Risks: A Continue user gets model wiring but no project rules, do-not-touch guidance, or pointer to the CI gates.
- Recommended improvement: Add `context` providers pointing at `AGENTS.md` and `docs/`, and a short `rules` block restating the do-not-touch/approval rules; or document that Continue is model-only by design.
- Suggested tests: A lightweight config lint that asserts the Continue config references `AGENTS.md`.
- Suggested docs: `.continue/README.md` or a note in `AGENTS.md`.

### Item: Vendored audit prompt packs

- Evidence: `prompts/{hardening_prompt_pack,portal-alignment,repo_audit_prompt_pack,repo-deep-dive}/`; `prompts/manifest.json`; `prompts/PROVENANCE.md`; external reference `C:\temp\repo-deep-dive` v1.4.1.
- What it does: Ships prompt templates and embedded generated outputs for AI-assisted audits/development.
- How it appears to work: Pin every file with SHA-256; block deploy on drift (`verify-prompts.js verify`); PROVENANCE states files are non-executable in the app runtime.
- Dependencies: `scripts/verify-prompts.js`, `validate.yml` `prompt-provenance` job.
- Current controls: Cryptographic pin + deploy-gate verification + `prompts/` excluded from Docker images (`.dockerignore`).
- Missing controls: No version/reference pin linking the vendored packs to a source version; no check that a pack's declared internal paths (runner/engine scripts, prompt list) actually exist; no recurring "is the pack current" check.
- Risks: Agents run stale instructions; run scaffolding references prompts that don't exist; retired packs are treated as live.
- Recommended improvement: Add a `version`/`source` header per pack and a CI check that each pack's README-referenced paths exist and that the run manifest's prompt list ⊆ the pack's prompt files.
- Suggested tests: A `scripts/check-prompt-packs.mjs` that verifies manifest prompt list vs pack files and README path references.
- Suggested docs: Update each pack README with a version line; update `PROVENANCE.md`.

### Item: Safe-change boundaries and gates

- Evidence: `.github/workflows/validate.yml`, `test.yml`, `lint.yml`, `typecheck.yml`, `codeql.yml`, `dependency-review.yml`, `deploy-do.yml`; `.github/CODEOWNERS`; `.github/branch-protection/*.json`; `package.json` `lint-staged`.
- What it does: Blocks merge/deploy on tests+coverage, lint, typecheck, CodeQL, dependency review, docs counts/links, DB-types, RLS hygiene, prompt provenance, review.md sync; deploy uses a health gate with auto-rollback.
- How it appears to work: PR checks + a `validate` deploy gate; branch protection requires checks + 1 review; `enforce_admins:false` allows admin bypass.
- Dependencies: GitHub environments/secrets for deploy; `validate.yml` parity with `test.yml`.
- Current controls: Strong, blocking, and mostly continuous.
- Missing controls: Enforcement of *which paths* an agent may change, a human-approval action list not tied to an environment, and a max-change-size rule.
- Risks: An admin or an agent with bypass can push drift; boundaries are documentation-led.
- Recommended improvement: Add the Agent guardrails section; consider `enforce_admins:true` for `main`; keep small-batch PR rule.
- Suggested tests: CI assertion that branch-protection JSON contexts match actual job names.
- Suggested docs: `AGENTS.md` guardrails; `docs/RELEASING.md` approval matrix.

## Scenario / Control Matrix

| ID | Scenario or control | Evidence | Current control | Gap | Severity | Recommendation |
|---|---|---|---|---|---|---|
| AI-001 | Agent instructions | `AGENTS.md`, `review.md` | Mirror-sync gate + counts guard | Stale repo path; no guardrails (allowed paths/approval) | P1/P2 | Fix path; add guardrails section |
| AI-002 | Copilot/Cursor/Windsurf/Claude configs | `.continue/agents/config.yaml` | Models only | No rules/context/allow-list; other editors absent | P2 | Add rules/context or document absence |
| AI-003 | Prompt packs | `prompts/*`, `PROVENANCE.md`, `manifest.json` | SHA-256 pin + deploy gate | `repo-deep-dive` stale (missing 41–45); 2 retired packs vendored; broken runner paths | P1 | Re-sync or mark retired; add pack-currency check |
| AI-004 | Repo maps | `docs/INDEX.md`, `prompts/*/engine/outputs/inventory.json` | Index + mapping doc | Embedded maps hardcode old repo path | P3 | Regenerate/annotate historical maps |
| AI-005 | Conventions | `docs/WEB_UI_CONVENTIONS.md`, `docs/testing.md` | Docs + counts guard | A11y "19 routes" stale (actual 25) in 3 docs | P2 | Correct docs; guard a11y count |
| AI-006 | Validation commands | `AGENTS.md`, `docs/RELEASING.md`, PR template | Documented + CI-enforced | No "CI vs local" distinction; e2e needs stack | P3 | Add runnability notes |
| AI-007 | Safe-change boundaries | CI gates, PR template, `PROVENANCE.md` | Blocking gates + prose | No machine-read allow/deny; no max-batch rule | P2 | Add guardrails + small-batch rule |
| AI-008 | Do-not-touch areas | `AGENTS.md` (NODE_ENV note), `.prettierignore` | Partial (prose) | No enumerated do-not-touch path list; generated files unlabeled | P2 | Add explicit do-not-touch list |
| AI-009 | Secrets guidance | `.env.example`, `.husky/pre-commit`, `SECURITY.md` | Pre-commit scan + placeholders | No secrets runbook linked from instructions | P3 | Link secrets runbook/rotation doc |
| AI-010 | PR guidance | `.github/PULL_REQUEST_TEMPLATE.md`, `CONTRIBUTING.md` | Checklist | No size rule; no AI-authorship disclosure | P2 | Add size + provenance disclosure |
| AI-011 | Audit output conventions | `docs/audits/README.md`, run `audit_manifest.json`/`INDEX.md` | Contract + scaffold | Manifest lists prompt `45` absent from vendored pack | P1 | Reconcile manifest with pack contents |
| AI-012 | Generated code risks | `manifest.json`, `database.types.ts`, `.prettierignore` | Pin + type-check guard | Embedded prompt-pack outputs unlabeled as historical vs instructions | P2 | Mark embedded outputs as non-instructions |

## Findings

### Finding ID: AI-P1-001 - Vendored audit prompt packs are stale and the run manifest references a prompt the pack does not contain

- Severity: P1
- Confidence: High
- Area: Prompt packs / audit output conventions
- Evidence:
  - `prompts/repo-deep-dive/prompts/` (43 files) vs external source `C:\temp\repo-deep-dive\prompts\` (49 files)
  - Missing from the vendored pack: `41_evidence_doctrine_gate_integrity_audit.md`, `42_cross_repo_integration_pairing_audit.md`, `43_edge_fleet_hardware_audit.md`, `44_data_quality_pipeline_fidelity_audit.md`, `45_exploit_chain_attack_path_audit.md`, `MASTER_RUNNER_FALCON_LAB.md`
  - `docs/audits/repo-deep-dive/20261002-0344-develop-6286137/audit_manifest.json:46` and `INDEX.md:55` list `45_exploit_chain_attack_path_audit.md` in the 42-step execution order
  - `prompts/repo-deep-dive/prompts/20_ai_automation_agent_readiness.md` sha256 `83FD53E7…` differs from external `6267CFBD…`
  - `prompts/hardening_prompt_pack/README.md:20-22,26` references `runner/run_all.py`, `runner/deep_adversarial_audit.py`, `runner/harden_run_all.py` and `runner/outputs/`; `Test-Path prompts/hardening_prompt_pack/runner/harden_run_all.py` = False, `runner/outputs` = False (`engine/outputs` exists instead)
  - `prompts/portal-alignment/README.md` and `engine/outputs/inventory.json:8` embed `C:\temp\mainecybertech-portal\...`
- What is happening: The repository vendors four audit packs. The `repo-deep-dive` copy is an older edition than the current source (missing prompts 41–45 introduced upstream, and a different prompt 20). The run scaffolding for this very audit run lists prompt `45`, which does not exist in the vendored pack. Two other packs advertise runner/engine paths and output directories that are not present in the vendored tree, and the current upstream pack declares the hardening and portal-alignment packs retired (their checks were consolidated into `repo-deep-dive`).
- Why it matters: An AI agent executing this run will look for prompt `45` and fail to find it, producing a partial run or improvising; an agent reading the hardening/portal-alignment READMEs will try to run scripts that do not exist; and an agent treating retired packs as current will apply superseded methodology. The instructions are not current with the code or with the tooling that spawned the run.
- User / business impact: Audit runs can silently skip a whole domain (exploit-chain/attack-path analysis), weakening release-gate confidence; wasted agent cycles chasing missing files.
- Security / privacy / reliability impact: Missing the attack-path/exploit-chain domain reduces security coverage; stale methodology risks false confidence in "GO" decisions.
- Recommended fix: (1) Replace the vendored `prompts/repo-deep-dive/` with the current pack (or, if the vendored copy is intentionally pinned, add a `VERSION`/source header and state it explicitly). (2) Either add `45_exploit_chain_attack_path_audit.md` or remove prompt `45` from the run manifest/INDEX and the `audit_manifest.json` executionOrder. (3) Mark `hardening_prompt_pack` and `portal-alignment` as retired archives in their READMEs (or remove them) and reconcile their referenced paths.
- Suggested validation: `node scripts/verify-prompts.js generate` then `verify`; a new check that every entry in a run's `audit_manifest.json` `executionOrder` resolves to a file under `prompts/<pack>/`; grep that each pack README's referenced script paths exist.
- Owner suggestion: Platform/AI tooling owner (CODEOWNERS `.github/` + `prompts/`).
- Effort estimate: M
- Dependencies: Access to the current upstream pack; decision on whether vendored packs are pinned or tracking.
- Status: open

### Finding ID: AI-P1-002 - `AGENTS.md` names a stale repository path and three developer docs state a stale accessibility gate size that no guard covers

- Severity: P1
- Confidence: High
- Area: Agent instructions / conventions / validation commands
- Evidence:
  - `AGENTS.md:3` — `**Repo:** \`C:\temp\mainecybertech-portal\`` while the current tree is `C:\temp\mainecybertech` and `.git/refs/heads/develop` = `62861370…`
  - `review.md:9` carries the same stale path (mirror in sync)
  - `apps/web/e2e/a11y.spec.ts:5-32` — `BASE_PAGES` has 25 entries; `AGENTS.md:58` says "25 pages" (correct)
  - `docs/testing.md:66` says "scans 19 core routes"; `docs/WEB_UI_CONVENTIONS.md:87` says "19 core routes"; `docs/CI.md:13,56` say "19-route gate"/"default 19-route gate" — all stale vs 25
  - `scripts/check-docs-counts.mjs` has no a11y/`testing.md` assertions (grep for `a11y|testing.md|core route` returns nothing)
- What is happening: The primary agent instruction file points agents at a repository path that no longer matches the checkout, and three developer-facing docs state an accessibility gate boundary (19 routes) that contradicts the actual spec (25 routes) and `AGENTS.md` itself (25). The docs-count guard enforces many counts but not this one, so the contradiction persists undetected.
- Why it matters: Agents copy paths and boundaries from these files. A wrong repo path can cause an agent to scope its work to the wrong tree; a wrong gate size can cause an agent to reason about coverage incorrectly (e.g. believing a page is out of the gate when it is in it).
- User / business impact: Mis-scoped agent changes; incorrect coverage claims in reviews and release decisions.
- Security / privacy / reliability impact: Reliability of the a11y gate reasoning; low direct security impact.
- Recommended fix: Update `AGENTS.md:3` to the current path (and confirm the same in any other doc), correct the three docs to "25 core routes", and extend `scripts/check-docs-counts.mjs` to assert the `BASE_PAGES` length against the documented number (fail the build on drift) in both `test.yml` and `validate.yml`.
- Suggested validation: `node scripts/check-docs-counts.mjs` fails when the doc says 19 and the spec has 25 after the guard is added; `node scripts/sync-review-md.mjs --check` passes after editing AGENTS.md + regenerating.
- Owner suggestion: Docs owner (CODEOWNERS `/docs/` = leads) + platform (guard script).
- Effort estimate: S
- Dependencies: None.
- Status: open

### Finding ID: AI-P2-001 - No machine-enforced agent guardrails: allowed paths, human-approval actions, and small-batch PR limits exist only as prose

- Severity: P2
- Confidence: High
- Area: Safe-change boundaries / PR guidance / do-not-touch areas
- Evidence:
  - `.continue/agents/config.yaml` (19 lines) contains only `models:` — no `rules`, `context`, `prompts`, or allow/deny lists
  - `AGENTS.md` states isolated rules ("Do NOT re-add test-mode bypasses" at lines 73-80) but has no enumerated allowed/forbidden path list or approval matrix
  - `.github/PULL_REQUEST_TEMPLATE.md` has a checklist but no maximum change size and no AI-authorship/disclosure line
  - `.github/branch-protection/develop.json` / `main.json` require status checks + 1 review and set `enforce_admins:false`
  - `.github/CODEOWNERS` maps directories to team handles, but `require_code_owner_reviews:false`
- What is happening: Safe-change boundaries are documented in prose and enforced indirectly by CI (tests/lint/typecheck/provenance), but there is no explicit, machine-readable statement of which paths an agent may modify, which actions require human sign-off, or how large a single change may be. Nothing prevents a large, multi-area PR as long as the gates pass, and nothing in `.continue` surfaces the rules at edit time.
- Why it matters: The prompt's mission is whether an agent can contribute *safely*. Boundaries that exist only as prose rely on every agent reading and obeying long documents; small-batch review, the main defense against wide agent-driven change, is not enforced.
- User / business impact: Higher review burden, larger blast radius per incident, and harder rollback attribution when an agent change spans many areas.
- Security / privacy / reliability impact: A single over-broad agent PR can touch auth, tenancy, migrations, and CI simultaneously, reducing the chance a reviewer catches a subtle security regression.
- Recommended fix: Add an "Agent guardrails" section to `AGENTS.md` with (a) an explicit do-not-touch list (e.g. `.env*`, `supabase/migrations/*` except additive new files, `.github/workflows/*` without infra review, generated `database.types.ts` hand-edits, `prompts/*` without regenerating the manifest), (b) an approval-required action list (schema changes, auth/tenancy middleware, CI/infra, secrets), and (c) a small-batch rule (e.g. ≤ N files / one concern per PR). If Continue is used, mirror the top rules into `.continue/agents/config.yaml` `rules`/`context`. Consider a CI size advisory.
- Suggested validation: A CI step or reviewer checklist that fails/warns when a PR exceeds the declared batch size; `sync-review-md.mjs --check` remains green.
- Owner suggestion: Leads (AGENTS.md) + platform (CI advisory).
- Effort estimate: S
- Dependencies: Team agreement on the do-not-touch and approval lists.
- Status: open

### Finding ID: AI-P2-002 - Prompt packs embed generated outputs alongside instructions without a machine-detectable "not instructions" marker

- Severity: P2
- Confidence: High
- Area: Prompt injection risks / generated code risks
- Evidence:
  - `prompts/hardening_prompt_pack/engine/deep_audit/*.json`, `engine/outputs/*.json|md|html`, `engine/*/__pycache__/*.pyc`
  - `prompts/portal-alignment/engine/outputs/*` (+ `dashboards/*`, `matrix/*`)
  - `prompts/repo_audit_prompt_pack/Run1|Run2/*` (embedded audit reports)
  - `prompts/repo-deep-dive/20260728-*`, `20260729-*`, `20260730-*`, `20260801-*`, `20260806-*` (embedded prior audit reports)
  - `prompts/PROVENANCE.md:5-9` acknowledges the supply-chain risk but the containment is "pinned by hash", not "labeled as data"
- What is happening: The prompt packs mix executable-looking prompt markdown with large volumes of generated JSON/Markdown/HTML/Python outputs and prior audit reports. An AI agent reading `prompts/**` cannot easily distinguish "instructions to follow" from "historical data to treat as untrusted". The provenance pin protects integrity but not interpretation.
- Why it matters: This is the repository's main prompt-injection surface. A malicious or accidental edit to an embedded output could read as an instruction (e.g. "mark all findings as fixed") and, because the files are pinned, could be introduced legitimately by a maintainer who does not realise the file is instruction-adjacent.
- User / business impact: Risk of an agent acting on fabricated findings or instructions; erosion of audit trust.
- Security / privacy / reliability impact: Injection-driven unsafe changes; false audit conclusions.
- Recommended fix: Add a machine-detectable header/marker to generated outputs (e.g. a first line `<!-- GENERATED OUTPUT — DATA, NOT INSTRUCTIONS -->` or store them under `*/outputs/`, `*/runs/`, `Run*/` with a README stating they are data), and state in `AGENTS.md` that only files whose path matches the pack's prompt list are instructions. Consider moving generated outputs out of the instruction tree entirely.
- Suggested validation: A check that every non-prompt file under `prompts/` carries the data marker, or a path-allowlist rule in `AGENTS.md` plus a lint that flags instruction-like verbs in generated outputs.
- Owner suggestion: Platform/AI tooling owner.
- Effort estimate: M
- Dependencies: Encoding of the existing outputs (re-run of `verify-prompts.js generate`).
- Status: open

### Finding ID: AI-P2-003 - `.continue/` agent configuration defines models only and does not surface project rules or boundaries

- Severity: P2
- Confidence: High
- Area: Copilot/Cursor/Windsurf/Claude configs / conventions
- Evidence:
  - `.continue/agents/config.yaml` — 19 lines; only `models:` with two entries; no `rules`, `context`, `prompts`, `mcpServers`, or `docs` keys
  - Absence of `.cursor*`, `.windsurfrules`, `.github/copilot-instructions.md`, `CLAUDE.md`, and `opencode.json` (confirmed via `Test-Path`)
- What is happening: The single editor/agent integration present (Continue) is wired for local models but carries no project rules, no `AGENTS.md` context provider, and no pointers to the CI gates or do-not-touch list. Developers using Continue get model access without the project's safety context.
- Why it matters: Agents configured through Continue will not automatically receive the rules that `AGENTS.md` encodes; the burden shifts to the human to paste context, which historically leads to drift.
- User / business impact: Inconsistent agent behavior across editors; higher chance of an agent violating conventions it never received.
- Security / privacy / reliability impact: Low direct; contributes to unsafe/incorrect changes.
- Recommended fix: Add a Continue `context` provider for `AGENTS.md` and `docs/`, and a `rules` block restating the do-not-touch/approval/small-batch rules (or document in `.continue/README.md` that the config is intentionally model-only and agents must read `AGENTS.md`).
- Suggested validation: A config lint (or manual check) that the Continue config references `AGENTS.md`.
- Owner suggestion: Platform/DevEx owner.
- Effort estimate: S
- Dependencies: None.
- Status: open

### Finding ID: AI-P3-001 - Embedded repo maps and historical pack outputs still reference the pre-rename repository path

- Severity: P3
- Confidence: High
- Area: Repo maps / generated code risks
- Evidence:
  - `prompts/portal-alignment/engine/outputs/inventory.json:8` — `"routes_dir": "C:\\temp\\mainecybertech-portal\\apps\\api\\src\\routes"`
  - `prompts/portal-alignment/engine/outputs/inventory.json` (and other embedded outputs) plus `prompts/repo-deep-dive/20260728-*`, `20260729-*` etc. carry `C:\temp\mainecybertech-portal`
  - `AGENTS.md:3` and `review.md:9` also carry `mainecybertech-portal`
  - Historical docs (`docs/ARCHITECTURAL_ANALYSIS.md`, `docs/MEGA_AUDIT_2026-06-18.md`, etc.) reference the old repo/package names
- What is happening: Embedded generated maps and prior audit outputs reference `mainecybertech-portal`, a path that does not exist in the current checkout. `AGENTS.md`/`review.md` repeat it.
- Why it matters: Agents that parse embedded JSON maps may attempt to operate on the stale path; humans may chase non-existent directories.
- User / business impact: Wasted effort, confusing onboarding.
- Security / privacy / reliability impact: None directly.
- Recommended fix: Regenerate the embedded maps from the current path, and either rewrite or clearly label historical outputs as historical (see AI-P2-002). Fix `AGENTS.md:3` per AI-P1-002.
- Suggested validation: Grep for `mainecybertech-portal` returns only files explicitly labeled historical.
- Owner suggestion: Docs/platform owner.
- Effort estimate: M
- Dependencies: AI-P2-002 (marker convention).
- Status: open

### Finding ID: AI-P3-002 - `AGENTS.md` retains a large self-contradicting "snapshot" history that an agent must disambiguate

- Severity: P3
- Confidence: High
- Area: Agent instructions / repo maps
- Evidence:
  - `AGENTS.md:388-412` "60-Module Implementation Status (2026-08-26 snapshot)" explicitly marked superseded
  - `AGENTS.md:895-912` "Features (snapshot …)" and "Testing (snapshot …)" stating "301 pages", "96 SQL migrations", "2,734 unit tests" with inline "_(now …)_" corrections
  - Multiple dated "Completed Work (…)" sections with overlapping counts (e.g. 3,262 → 3,476 → 3,490)
- What is happening: `AGENTS.md` is both a current reference and an append-only history. Several blocks present outdated counts with parenthetical corrections rather than a single source of truth.
- Why it matters: Agents and reviewers can read the first number they encounter (e.g. "2,734 tests") and act on it; the corrections are easy to miss.
- User / business impact: Incorrect status reporting; wasted reconciliation effort.
- Security / privacy / reliability impact: None directly (reliability of reporting).
- Recommended fix: Move historical "snapshot"/"Completed Work" content to a separate changelog-style doc (e.g. `docs/HISTORY.md`) and keep `AGENTS.md` to current state + Known Debt, or clearly fence historical blocks with a machine-detectable marker.
- Suggested validation: `check-docs-counts.mjs` already guards the header table; ensure no second, unguarded count of the same metric remains.
- Owner suggestion: Leads (docs).
- Effort estimate: M
- Dependencies: None.
- Status: open

### Finding ID: AI-P3-003 - Secrets guidance is spread across instructions without a linked canonical runbook

- Severity: P3
- Confidence: Medium
- Area: Secrets guidance
- Evidence:
  - `.env.example` files (api/web/worker/infra) contain placeholders/hosts only (verified; no `sk_/eyJ/AKIA/ghp_/xox/whsec_/BEGIN KEY`)
  - `.husky/pre-commit` runs `scripts/scan-secrets.sh` then `lint-staged`
  - `AGENTS.md` has "Key Environment Variables" sections and PROVENANCE mentions "do not print secrets"
  - No secrets-rotation runbook is linked from `AGENTS.md`/`CONTRIBUTING.md` (a `scripts/scan-secrets.sh` exists; rotation guidance is not centralised in an agent-referenced doc)
- What is happening: Placeholder hygiene and a pre-commit secret scanner are good, but the agent-facing guidance on what counts as a secret, how to handle a found secret, and how rotation works is not consolidated into one referenced document.
- Why it matters: An agent that encounters a secret-like value has no single place to learn the handling procedure.
- User / business impact: Slower, less consistent incident handling if a secret is exposed by an agent change.
- Security / privacy / reliability impact: Low-to-moderate; procedural.
- Recommended fix: Add/link a secrets runbook (e.g. `docs/SECRETS.md`) covering placeholder rules, the scanner, and rotation/revocation, and reference it from `AGENTS.md`, `CONTRIBUTING.md`, and the PR template.
- Suggested validation: PR template checklist item links the runbook; scan for the runbook reference.
- Owner suggestion: Security/infra owner.
- Effort estimate: S
- Dependencies: None.
- Status: open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| Agent executes an audit run that references a missing prompt and silently skips a domain | P1 | High | Medium | `audit_manifest.json:46`, `INDEX.md:55` vs absent `45_*.md` | AI-P1-001 |
| Agent scopes work to a non-existent repo path | P1 | Medium | Medium | `AGENTS.md:3`, `review.md:9` | AI-P1-002 |
| Agent reasons from a wrong a11y gate size (19 vs 25) | P2 | Medium | Low | `docs/testing.md:66`, `docs/WEB_UI_CONVENTIONS.md:87`, `docs/CI.md:13,56` | AI-P1-002 |
| Over-broad agent PR touching many domains passes gates | P2 | Medium | High | No size rule in `.github/PULL_REQUEST_TEMPLATE.md`; prose-only boundaries | AI-P2-001 |
| Prompt injection via embedded generated outputs in `prompts/` | P2 | Low | High | Hundreds of embedded JSON/md/py outputs; PROVENANCE notes the surface | AI-P2-002 |
| Continue users get models without project rules | P2 | Medium | Low | `.continue/agents/config.yaml` models only | AI-P2-003 |
| Retired packs (hardening, portal-alignment) applied as current | P2 | Medium | Medium | Pack READMEs; upstream states retirement | AI-P1-001 |
| Historical counts in AGENTS.md mislead status reporting | P3 | Medium | Low | `AGENTS.md:895-912` | AI-P3-002 |
| Admin bypass of branch protection (`enforce_admins:false`) | P2 | Low | High | `.github/branch-protection/*.json` | Consider `enforce_admins:true` for main (AI-P1-001 area, governance) |

## Recommendations

### Immediate / Release Blocking

None. No P0 finding. Gates (tests, lint, typecheck, CodeQL, provenance, docs counts) are present and blocking for normal PRs.

### This Week

1. **AI-P1-001** — Reconcile the `repo-deep-dive` vendored pack and the run manifest: either add prompts `41–45` (or remove prompt `45` from `audit_manifest.json`/`INDEX.md`), and mark `hardening_prompt_pack`/`portal-alignment` as retired archives.
2. **AI-P1-002** — Fix `AGENTS.md:3` repo path; correct the "19 core routes" text in `docs/testing.md`, `docs/WEB_UI_CONVENTIONS.md`, `docs/CI.md`; extend `check-docs-counts.mjs` to guard the a11y count.
3. **AI-P2-001** — Add the Agent guardrails section (do-not-touch list, approval-required actions, small-batch rule) to `AGENTS.md` and mirror into `review.md`.

### This Month

4. **AI-P2-002** — Label generated prompt-pack outputs as data-not-instructions; add a lint for the marker.
5. **AI-P2-003** — Add rules/context to `.continue` or document the deliberate absence.
6. **AI-P3-001/002/003** — Regenerate/label stale maps, split historical content out of `AGENTS.md`, and add a linked secrets runbook.

### Later / Platform Evolution

7. Add a `scripts/check-prompt-packs.mjs` that verifies each pack's README paths and the run manifest's prompt list against the pack's files.
8. Consider `enforce_admins:true` for `main` and a CI size advisory for agent PRs.
9. Introduce a pack `VERSION`/source header and a recurring "upstream pack changed" check.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Fix the repo path in AGENTS.md | Removes a wrong scoping signal for every agent | `AGENTS.md:3` (+ regenerate `review.md`) | `sync-review-md.mjs --check` |
| Correct "19 core routes" → "25" | Aligns boundary docs with the spec | `docs/testing.md:66`, `docs/WEB_UI_CONVENTIONS.md:87`, `docs/CI.md:13,56` | grep for "19 core routes" returns nothing |
| Add a11y count to the docs guard | Prevents future silent drift | `scripts/check-docs-counts.mjs` | guard fails on mismatch |
| Remove prompt `45` from the run manifest/INDEX (or add the file) | Makes the run internally consistent | `docs/audits/.../audit_manifest.json`, `INDEX.md` | manifest entries resolve to files |
| Add "small-batch PR" bullet to PR template | Cheap, immediate boundary | `.github/PULL_REQUEST_TEMPLATE.md` | reviewer acknowledgment |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Re-sync/label vendored prompt packs; add pack-currency check | P1 | Platform/AI tooling | M | Upstream pack access |
| Guard a11y count + fix stale repo path | P1 | Docs + platform | S | None |
| Agent guardrails section (paths, approvals, batch size) | P2 | Leads | S | Team agreement |
| Label generated outputs as non-instructions | P2 | Platform/AI tooling | M | Regenerate manifest |
| Continue `rules`/`context` | P2 | DevEx | S | None |
| Split AGENTS.md history into `docs/HISTORY.md` | P3 | Leads | M | None |
| Secrets runbook linked from instructions | P3 | Security/infra | S | None |
| `check-prompt-packs.mjs` | P3 | Platform | M | Pack headers |

## Suggested Tests

- **CI/guard:** Extend `scripts/check-docs-counts.mjs` to assert the `BASE_PAGES` length in `apps/web/e2e/a11y.spec.ts` equals the number stated in `AGENTS.md`/`docs/testing.md`; run in `test.yml` + `validate.yml`.
- **CI/guard:** New `scripts/check-prompt-packs.mjs` — assert (a) every `executionOrder` entry in any `docs/audits/**/audit_manifest.json` resolves to a file under `prompts/<pack>/`, (b) each pack README's referenced script paths exist, (c) each non-prompt file under `prompts/` carries the data marker.
- **CI/security:** A check that generated-output files under `prompts/` do not contain imperative "instruction" patterns without the data marker (heuristic, warn-only initially).
- **Unit:** `sync-review-md.mjs` negative test — editing `AGENTS.md` without regeneration makes `--check` fail.
- **Manual validation:** Run the audit pack's `MASTER_RUNNER_FULL_HARDENING.md` drive against a scratch `docs/audits/<name>/<run>/` and confirm every listed prompt resolves (currently fails on prompt `45`).
- **Manual validation:** `node scripts/verify-prompts.js verify` after any intended `prompts/` change (must regenerate the manifest first).
- **Regression:** Grep gate that `mainecybertech-portal` appears only in files explicitly labeled historical.
- **E2E:** No change; a11y `BASE_PAGES` behavior unchanged (count corrected in docs only).

## Suggested Documentation Updates

- `AGENTS.md` — fix repo path (line 3); add "Agent guardrails" section (allowed paths, approval-required actions, small-batch rule, do-not-touch list); link a secrets runbook; fence historical snapshots.
- `review.md` — regenerate from `AGENTS.md` (`node scripts/sync-review-md.mjs`).
- `docs/testing.md` — correct a11y count (19 → 25) and note the CI vs local runnability.
- `docs/WEB_UI_CONVENTIONS.md` — correct a11y count (19 → 25).
- `docs/CI.md` — correct "19-route gate" (lines 13, 56-57) to 25.
- `prompts/PROVENANCE.md` — add pack versions/source and the data-vs-instruction marker convention.
- `prompts/repo-deep-dive/README.md` (and each pack README) — add a version/source header; mark retired packs.
- `.github/PULL_REQUEST_TEMPLATE.md` — add small-batch and AI-authorship disclosure lines; link the secrets runbook.
- `.continue/README.md` (new) or `.continue/agents/config.yaml` comments — document rules/context intent.
- `docs/HISTORY.md` (new) — receive the snapshot/Completed Work history moved out of `AGENTS.md`.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is the vendored `prompts/` tree intentionally pinned to an old edition, or is it simply un-synced? | Determines whether AI-P1-001 is "update" or "document as pinned" | Maintainer intent / a `VERSION`/source header per pack |
| Should prompts `41–45` (cross-repo, edge-fleet, data-quality, exploit-chain) be in scope for this single-repo audit? | Affects whether removing prompt `45` from the manifest is correct vs adding it | `profiles/falcon-lab.md` applicability matrix in the upstream pack |
| Who owns the `prompts/` tree (CODEOWNERS points `/docs/` to leads but `prompts/` is unlisted)? | Determines review path for pack changes | `.github/CODEOWNERS` update |
| Is `.continue/` actually used by contributors, or vestigial? | Prioritises AI-P2-003 | Contributor survey / usage telemetry |
| Are `develop`/`main` branch-protection JSON files actually applied (and is admin bypass intended)? | AI-P1/governance confidence | GitHub API / settings export |
| What is the agreed maximum agent PR size? | AI-P2-001 cannot be enforced without a number | Team decision |

## Appendix

### Appendix A — Prompt pack file counts (disk, recursive)

| Pack | Files | External source files | Missing in vendored |
|---|---:|---:|---|
| `hardening_prompt_pack` | 70 | (upstream retired) | n/a |
| `mct-full-webstore-product-catalog-pack` | 193 | (out of scope) | n/a |
| `mct-portal-os-expanded-60-modules-deep-prompts-pack` | 222 | (out of scope) | n/a |
| `portal-alignment` | 63 | (upstream retired) | n/a |
| `repo-deep-dive` | 210 (43 under `prompts/`) | 49 under `prompts/` | `41`–`45`, `MASTER_RUNNER_FALCON_LAB.md` |
| `repo_audit_prompt_pack` | 28 | (upstream retired) | n/a |

### Appendix B — Agent config inventory (presence)

| Config | Path | Present | Contents |
|---|---|---|---|
| Continue | `.continue/agents/config.yaml` | Yes | Models only |
| Cursor | `.cursor*` | No | — |
| Windsurf | `.windsurfrules` | No | — |
| GitHub Copilot | `.github/copilot-instructions.md` | No | — |
| Claude | `CLAUDE.md` | No | — |
| OpenCode | `opencode.json` | No | — |
| MCP | `*.mcp.json` / mcp configs | No | — |
| VS Code | `.vscode/{settings,launch,extensions}.json` | Yes | Editor settings only |

### Appendix C — Gate inventory (what blocks an agent change)

```mermaid
flowchart LR
  A[Agent PR] --> B[test.yml: coverage, OpenAPI, docs counts/links, DB-types, RLS, audit, Trivy, secrets]
  A --> C[lint.yml]
  A --> D[typecheck.yml]
  A --> E[codeql.yml]
  A --> F[dependency-review.yml]
  A --> G[e2e.yml PR\n(a11y 25-route gate)]
  A --> H[.husky/pre-commit:\nscan-secrets + lint-staged]
  subgraph Deploy
    I[validate.yml\ndeploy gate:\n+ prompt-provenance\n+ review.md sync]
    J[deploy-do.yml\nprod: e2e-gate + migrate-gate\nhealth gate + auto-rollback]
  end
  A -.merge to develop/main.-> I --> J
```

### Appendix D — Verification commands (as written in the repo)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # CONTRIBUTING.md
node scripts/verify-prompts.js verify                     # PROVENANCE.md / validate.yml
node scripts/verify-prompts.js generate                   # after intended prompts/ changes
node scripts/sync-review-md.mjs --check                   # validate.yml
node scripts/check-docs-counts.mjs                        # test.yml / validate.yml
node scripts/generate-db-types.js --check                 # test.yml / validate.yml
node scripts/verify-rls.mjs                               # test.yml / validate.yml
```

Note: these could not be executed in the audit shell (no `node`/`pnpm` on `PATH`); static verification of the guards' presence and of their source was performed instead.

### Appendix E — Method

- Read `00_SHARED_AUDIT_RULES.md`, `20_ai_automation_agent_readiness.md`, and `docs/AUTOMATION_GUIDE.md` first (normative), then the repo.
- Counts were produced with PowerShell `Get-ChildItem` recursion; hashes with `System.Security.Cryptography.SHA256` over LF-normalized content (matching `verify-prompts.js`).
- The prior audit was read for context only and re-tested against the current tree; its MCP/OpenAPI/API-key framing was **not** carried forward because it does not match this prompt's mission or this repository path.
