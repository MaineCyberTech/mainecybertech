#!/usr/bin/env node
/**
 * Historical gate-artifact guard (EXEC-P3-001).
 *
 * `prompts/` is pinned historical data, but its committed alignment-engine
 * outputs carry machine-readable release decisions (`APPROVED_FOR_PROD_DEPLOY`,
 * `BLOCKED`) that an automated consumer could cite as current release evidence.
 * Two of them even disagree, and neither binds a verifiable commit SHA.
 *
 * This guard fails when any JSON file under `prompts/` has a top-level
 * `decision` without the explicit `historical: true` marker added in the
 * EXEC-P3-001 remediation, so a future re-run (or a new output) cannot silently
 * reintroduce an unmarked approval artifact. Marked historical outputs remain
 * allowed; a current gate must live in `docs/` and bind a full SHA.
 *
 * Dependency-free (plain Node). `--self-test` runs the checker against inline
 * fixtures so a broken detector cannot pass silently.
 *
 * Usage:
 *   node scripts/check-historical-gates.mjs
 *   node scripts/check-historical-gates.mjs --self-test
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROMPTS_DIR = join(ROOT, "prompts");

/**
 * Pure checker: returns a list of problems for one parsed JSON document.
 * `decision` at the top level is the release-decision shape the alignment
 * engine emits; every other JSON is ignored.
 */
export function checkDocument(relPath, parsed) {
  const problems = [];
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return problems;
  if (!Object.prototype.hasOwnProperty.call(parsed, "decision")) return problems;
  if (parsed.historical !== true) {
    problems.push(
      `${relPath}: has decision=${JSON.stringify(parsed.decision)} without "historical": true — ` +
        "mark it as a historical snapshot or remove it (EXEC-P3-001)",
    );
  }
  return problems;
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

export function scanPrompts(promptsDir) {
  const problems = [];
  for (const file of walk(promptsDir)) {
    const rel = file.slice(promptsDir.length + 1).split("\\").join("/");
    if (rel === "manifest.json") continue;
    let parsed;
    try {
      parsed = JSON.parse(stripBom(readFileSync(file, "utf8")));
    } catch (error) {
      problems.push(`${rel}: not valid JSON (${error instanceof Error ? error.message : error})`);
      continue;
    }
    problems.push(...checkDocument(rel, parsed));
  }
  return problems;
}

function selfTest() {
  const failures = [];
  const expect = (label, condition) => {
    if (!condition) failures.push(`self-test: ${label}`);
  };

  expect(
    "unmarked approval is reported",
    checkDocument("x.json", { decision: "APPROVED_FOR_PROD_DEPLOY" }).length === 1,
  );
  expect(
    "unmarked block is reported",
    checkDocument("x.json", { decision: "BLOCKED" }).length === 1,
  );
  expect(
    "marked historical output is allowed",
    checkDocument("x.json", { historical: true, decision: "APPROVED_FOR_PROD_DEPLOY" }).length === 0,
  );
  expect("documents without a decision are ignored", checkDocument("x.json", { p0: 0 }).length === 0);
  expect("arrays are ignored", checkDocument("x.json", [1, 2]).length === 0);
  expect("BOM is stripped", stripBom("\ufeff{}") === "{}");

  if (failures.length) {
    console.error(failures.join("\n"));
    console.error("historical-gates guard self-test FAILED");
    process.exit(1);
  }
  console.log("historical-gates guard self-test OK");
}

const mode = process.argv[2];
if (mode === "--self-test") {
  selfTest();
} else {
  const problems = scanPrompts(PROMPTS_DIR);
  if (problems.length) {
    console.error(`unmarked historical gate outputs detected (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("historical gate markers OK");
}
