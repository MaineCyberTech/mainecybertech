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
 * index (ORCH-P2-001).
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

console.log("docs links OK");
