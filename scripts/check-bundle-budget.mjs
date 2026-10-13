#!/usr/bin/env node
/**
 * Web bundle-size budget gate (PERF-P3-003).
 *
 * The Next.js bundle analyzer (`ANALYZE=true`) is opt-in and never runs in CI,
 * so bundle growth was invisible until it hit users. This script measures the
 * built client JS under `apps/web/.next/static` and fails when it exceeds the
 * budgets committed in `scripts/bundle-budget.json`. It runs in `e2e.yml`
 * right after the web build.
 *
 * Usage:
 *   node scripts/check-bundle-budget.mjs [static-dir]
 *
 * Exit codes: 0 = within budget, 1 = over budget / nothing to measure.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BUDGET_FILE = path.join(__dirname, "bundle-budget.json");
const DEFAULT_DIR = path.join(ROOT, "apps", "web", ".next", "static");

function collectJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsFiles(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function main() {
  const dir = path.resolve(process.argv[2] ?? DEFAULT_DIR);
  if (!fs.existsSync(dir)) {
    console.error(`Bundle budget: no build output at ${dir} — run the web build first.`);
    process.exit(1);
  }
  const budgets = JSON.parse(fs.readFileSync(BUDGET_FILE, "utf-8"));
  const files = collectJsFiles(dir);
  if (files.length === 0) {
    console.error(`Bundle budget: no .js files under ${dir}.`);
    process.exit(1);
  }

  let total = 0;
  let totalGzip = 0;
  let largest = { size: 0, file: "" };
  for (const file of files) {
    const buf = fs.readFileSync(file);
    total += buf.length;
    totalGzip += zlib.gzipSync(buf, { level: 6 }).length;
    if (buf.length > largest.size) {
      largest = { size: buf.length, file: path.relative(dir, file) };
    }
  }

  const kib = (bytes) => Math.round(bytes / 1024);
  const checks = [
    { label: "total client JS", actual: kib(total), budget: budgets.totalKb },
    { label: "total client JS (gzip)", actual: kib(totalGzip), budget: budgets.totalGzipKb },
    { label: "largest single chunk", actual: kib(largest.size), budget: budgets.largestChunkKb },
  ];

  let failed = false;
  for (const { label, actual, budget } of checks) {
    const ok = actual <= budget;
    if (!ok) failed = true;
    console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${actual} KiB (budget ${budget} KiB)`);
  }
  console.log(`Largest chunk: ${largest.file}`);
  console.log(`Measured ${files.length} JS files under ${path.relative(ROOT, dir)}.`);

  if (failed) {
    console.error(
      "Web bundle budget exceeded — see scripts/bundle-budget.json. If the growth is " +
        "justified, raise the budget in a reviewed PR (and check for accidental imports).",
    );
    process.exit(1);
  }
}

main();
