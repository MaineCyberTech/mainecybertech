#!/usr/bin/env node
/**
 * Advisory size-budget guard for the docs/audits corpus (HYGIENE-P3-014).
 *
 * Every re-audit commits a full corpus copy under docs/audits/, so the tree
 * grows with each run. Mirroring the prompts/ budget
 * (scripts/verify-prompts.js, prompts/PROVENANCE.md), this reports the current
 * corpus against the budget documented in docs/audits/README.md
 * ("Size budget and retention").
 *
 * Deliberately non-blocking: the corpus is historical evidence, and publishing
 * a new run must never be blocked by the budget. The default mode prints a
 * warning annotation when the budget is exceeded and always exits 0;
 * `--strict` exits 1 for local/operator use. When the budget is crossed,
 * archive the oldest run directories (they stay recoverable from git history)
 * or raise the budget as a deliberate, reviewed change.
 *
 * Usage:
 *   node scripts/check-audits-budget.mjs            # advisory report (exit 0)
 *   node scripts/check-audits-budget.mjs --strict   # exit 1 when over budget
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const AUDITS_DIR = join(ROOT, "docs/audits");

// Budget documented in docs/audits/README.md. At the time of writing the
// corpus held 9 run directories / 116 files / ~3.8 MiB.
const MAX_RUNS = 12;
const MAX_FILES = 180;
const MAX_BYTES = 7 * 1024 * 1024;

const MIB = 1024 * 1024;

function listRunDirs() {
  const runs = [];
  for (const pack of readdirSync(AUDITS_DIR, { withFileTypes: true })) {
    if (!pack.isDirectory()) continue;
    const packDir = join(AUDITS_DIR, pack.name);
    for (const run of readdirSync(packDir, { withFileTypes: true })) {
      if (!run.isDirectory()) continue;
      const runDir = join(packDir, run.name);
      if (existsSync(join(runDir, "report.md")) || existsSync(join(runDir, "audit_manifest.json"))) {
        runs.push(runDir);
      }
    }
  }
  return runs;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const runs = listRunDirs();
const files = walk(AUDITS_DIR);
let bytes = 0;
for (const file of files) bytes += statSync(file).size;

const over = [];
if (runs.length > MAX_RUNS) over.push(`${runs.length}/${MAX_RUNS} run directories`);
if (files.length > MAX_FILES) over.push(`${files.length}/${MAX_FILES} files`);
if (bytes > MAX_BYTES) over.push(`${(bytes / MIB).toFixed(1)}/${(MAX_BYTES / MIB).toFixed(1)} MiB`);

const summary =
  `docs/audits: ${runs.length}/${MAX_RUNS} runs, ${files.length}/${MAX_FILES} files, ` +
  `${(bytes / MIB).toFixed(1)}/${(MAX_BYTES / MIB).toFixed(1)} MiB`;

if (over.length === 0) {
  console.log(`${summary} — within budget (HYGIENE-P3-014)`);
  process.exit(0);
}

const message =
  `${summary} — over the documented budget (${over.join(", ")}). ` +
  "Archive the oldest run directories (recoverable from git history) or raise " +
  "the budget in docs/audits/README.md as a deliberate, reviewed change.";
console.log(`::warning title=docs/audits size budget exceeded::${message}`);
console.warn(message);
if (process.argv.includes("--strict")) process.exit(1);
process.exit(0);
