#!/usr/bin/env node
/**
 * Docs link guard (dependency-free ESM).
 *
 * Scans a fixed list of primary repo docs for inline markdown links
 * (`](target)`) whose target does not exist on disk. Files in the list that
 * are missing are skipped, so renames never break the guard — only links
 * inside a doc that exists are checked.
 *
 * Ignored targets: `http(s)://`, `mailto:`, `#`-only/anchors, and the
 * optional `"title"` after the path. Anchors (`#...`) and query strings are
 * stripped before resolution, `decodeURIComponent` is applied, and the
 * target is resolved relative to the source file's directory.
 *
 * Also fails when an audit run directory under `docs/audits/` (a directory
 * with `report.md` or `audit_manifest.json`) is not referenced by
 * `docs/audits/README.md` — a published run must be discoverable from the
 * index (ORCH-P2-001) — or lacks the `HISTORICAL.md` marker (DOC-P3-001).
 * Also fails when a scanned primary doc contains a machine-local path
 * (`C:\...` / `file:///C:...`) that cannot exist on another checkout
 * (DOC-P3-001); the dated audit corpus is exempt.
 * Also fails when the docs/CI.md workflow table and `.github/workflows/`
 * disagree (CI-P3-011): every workflow file must be listed in the table's
 * File column, and every file listed there must exist.
 *
 * Prints every broken link as `file:line -> target`, exits 1 when any are
 * found; prints "docs links OK" and exits 0 when clean.
 *
 * Usage: node scripts/check-docs-links.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Primary docs to scan. Missing entries are skipped (tolerates renames). */
const PRIMARY_DOCS = [
  "README.md",
  "README.dev.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "docs/INDEX.md",
  "docs/audits/README.md",
  "docs/RELEASING.md",
  "docs/ui-kit.md",
  "docs/MFA.md",
  "docs/WEB_UI_CONVENTIONS.md",
  "docs/module-matrix-mapping.md",
  "docs/adr/README.md",
  "docs/testing.md",
  "docs/CI.md",
  "docs/PERFORMANCE.md",
  "docs/runbooks/README.md",
  "docs/features/README.md",
  "docs/INCIDENT_RESPONSE.md",
  "docs/SECRETS_ROTATION.md",
  "docs/JWT_ROTATION.md",
  "CODE_OF_CONDUCT.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
];

const IGNORED_SCHEME = /^(https?:|mailto:)/i;
const INLINE_LINK = /\]\(([^)]+)\)/g;

/**
 * Extracts the link target from a raw `](...)` capture:
 * drops an optional markdown title, surrounding `<>`, anchors and queries,
 * and percent-decodes it. Returns `null` for targets that should be ignored.
 */
function normalizeTarget(raw) {
  let target = raw.trim();
  if (target.startsWith("<")) {
    const close = target.indexOf(">");
    if (close !== -1) target = target.slice(1, close);
  } else {
    // `path/to/file.md "Optional title"` — keep only the path.
    const space = target.search(/\s/);
    if (space !== -1) target = target.slice(0, space);
  }
  if (!target) return null;
  if (target.startsWith("#")) return null;
  if (IGNORED_SCHEME.test(target)) return null;

  const hash = target.indexOf("#");
  if (hash !== -1) target = target.slice(0, hash);
  const query = target.indexOf("?");
  if (query !== -1) target = target.slice(0, query);
  if (!target) return null;

  try {
    target = decodeURIComponent(target);
  } catch {
    // Keep the raw target when it is not valid percent-encoding.
  }
  return target || null;
}

const broken = [];

for (const doc of PRIMARY_DOCS) {
  const absPath = join(ROOT, doc);
  if (!existsSync(absPath)) continue;

  const lines = readFileSync(absPath, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(INLINE_LINK)) {
      const target = normalizeTarget(match[1]);
      if (!target) continue;
      const resolved = target.startsWith("/")
        ? join(ROOT, target.slice(1))
        : resolve(dirname(absPath), target);
      if (!existsSync(resolved)) {
        broken.push(`${doc}:${index + 1} -> ${target}`);
      }
    }
  });
}

if (broken.length > 0) {
  console.error(`broken docs links detected (${broken.length}):`);
  for (const entry of broken) console.error(`  ${entry}`);
  process.exit(1);
}

// --- Audit run index coverage (ORCH-P2-001) --------------------------------
// Every run directory under docs/audits/ must be referenced by the index, so a
// published run cannot be invisible to readers or agents. A run directory is
// one that contains a report.md (manual packs) or an audit_manifest.json
// (repo-deep-dive runs).
const AUDITS_ROOT = join(ROOT, "docs/audits");
const AUDITS_INDEX = join(AUDITS_ROOT, "README.md");
const unindexed = [];
if (existsSync(AUDITS_INDEX)) {
  const indexText = readFileSync(AUDITS_INDEX, "utf8");
  for (const pack of readdirSync(AUDITS_ROOT, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    const packDir = join(AUDITS_ROOT, pack.name);
    for (const run of readdirSync(packDir, { withFileTypes: true })) {
      if (!run.isDirectory()) continue;
      const runDir = join(packDir, run.name);
      if (!existsSync(join(runDir, "report.md")) && !existsSync(join(runDir, "audit_manifest.json"))) continue;
      if (!indexText.includes(`${pack.name}/${run.name}`)) {
        unindexed.push(`docs/audits/${pack.name}/${run.name}`);
      }
    }
  }
}
if (unindexed.length > 0) {
  console.error(`audit runs missing from docs/audits/README.md (${unindexed.length}):`);
  for (const entry of unindexed) console.error(`  ${entry}`);
  process.exit(1);
}

// --- Historical markers + machine-local paths (DOC-P3-001) -----------------
// Every run directory must carry the HISTORICAL.md marker documented in
// docs/audits/README.md, so a dated run can never be mistaken for current
// state. The dated corpus itself keeps its raw machine paths as historical
// evidence and is exempt from the path scan below; a *current* primary doc
// must not send a reader to a path that cannot exist on another checkout.
const unmarked = [];
for (const pack of readdirSync(AUDITS_ROOT, { withFileTypes: true })) {
  if (!pack.isDirectory()) continue;
  const packDir = join(AUDITS_ROOT, pack.name);
  for (const run of readdirSync(packDir, { withFileTypes: true })) {
    if (!run.isDirectory()) continue;
    const runDir = join(packDir, run.name);
    if (!existsSync(join(runDir, "report.md")) && !existsSync(join(runDir, "audit_manifest.json"))) continue;
    if (!existsSync(join(runDir, "HISTORICAL.md"))) {
      unmarked.push(`docs/audits/${pack.name}/${run.name}`);
    }
  }
}
if (unmarked.length > 0) {
  console.error(`audit runs missing the HISTORICAL.md marker (${unmarked.length}):`);
  for (const entry of unmarked) console.error(`  ${entry}`);
  process.exit(1);
}

const MACHINE_PATH_RE = /(?:[A-Za-z]:\\|file:\/\/\/[A-Za-z]:)/;
const machinePaths = [];
for (const doc of PRIMARY_DOCS) {
  const absPath = join(ROOT, doc);
  if (!existsSync(absPath)) continue;
  readFileSync(absPath, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (MACHINE_PATH_RE.test(line)) machinePaths.push(`${doc}:${index + 1}`);
    });
}
if (machinePaths.length > 0) {
  console.error(`machine-local paths in current docs (${machinePaths.length}):`);
  for (const entry of machinePaths) console.error(`  ${entry}`);
  process.exit(1);
}

// --- Workflow inventory parity (CI-P3-011) ---------------------------------
// docs/CI.md is the canonical workflow inventory. The File column of its table
// must list every `.github/workflows/*.yml` file, and must not reference a
// workflow that no longer exists — docs drift is how a removed workflow kept
// being cited and a live one stayed undocumented.
const WF_DIR = join(ROOT, ".github/workflows");
const CI_DOC = join(ROOT, "docs/CI.md");
if (existsSync(WF_DIR) && existsSync(CI_DOC)) {
  const workflowFiles = readdirSync(WF_DIR).filter((f) => /\.ya?ml$/.test(f));
  const listed = new Set();
  for (const line of readFileSync(CI_DOC, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith("|")) continue;
    // cells: ["", " Workflow ", " File ", ...] — the File column is index 2.
    const cells = trimmedLine.split("|");
    const fileCell = cells[2]?.trim() ?? "";
    const m = /^`([A-Za-z0-9._-]+\.ya?ml)`$/.exec(fileCell);
    if (m) listed.add(m[1]);
  }
  const missingFromDoc = workflowFiles.filter((f) => !listed.has(f));
  const missingFromTree = [...listed].filter((f) => !workflowFiles.includes(f));
  if (missingFromDoc.length > 0 || missingFromTree.length > 0) {
    console.error("workflow inventory drift (docs/CI.md vs .github/workflows/):");
    for (const f of missingFromDoc) console.error(`  docs/CI.md is missing a row for: ${f}`);
    for (const f of missingFromTree) {
      console.error(`  docs/CI.md references a removed workflow: ${f}`);
    }
    process.exit(1);
  }
}

console.log("docs links OK");
