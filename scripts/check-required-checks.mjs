#!/usr/bin/env node
/**
 * Guard: every required status check in .github/branch-protection/*.json must
 * be a check-run name that some workflow actually emits, and the workflow
 * emitting it must not path-filter its `pull_request` trigger.
 *
 * Why this exists (audit findings CI-P1-002 / BP-P1-001, run 20261002-0344):
 * when a required context does not match a real check-run, GitHub shows the
 * check as "Expected — Waiting for status to be reported" forever, so the PR
 * can never satisfy branch protection. Worse, a context like "Dependency
 * Review" (workflow name, not the emitted "Dependency Review / review") used to
 * be treated as an app-level status, so it could be silently satisfied by any
 * app publishing that name instead of running the actual workflow.
 *
 * A path-filtered required workflow is the same class of bug (BP-P2-004 /
 * CI-P2-009): the workflow only starts when the changed files match its
 * `paths:` list, so a PR that misses those paths never gets the check-run and
 * stays blocked on a check that can never report.
 *
 * Usage:
 *   node scripts/check-required-checks.mjs            # fail on any gap
 *   node scripts/check-required-checks.mjs --warn     # report, exit 0
 *   node scripts/check-required-checks.mjs \
 *     --workflows-dir <dir> --branch-protection-dir <dir>   # fixtures
 *
 * Wired into CI via .github/actions/unit-tests (PR gate + deploy gate);
 * scripts/ci/check-required-checks.sh also runs a negative fixture through it.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < args.length && !args[i + 1].startsWith("--")) {
    return args[i + 1];
  }
  return fallback;
}

const WF_DIR = argValue("workflows-dir", ".github/workflows");
const BP_DIR = argValue("branch-protection-dir", ".github/branch-protection");
const WARN_ONLY = args.includes("--warn");

/** True when the workflow's `pull_request` trigger carries `paths:` /
 * `paths-ignore:`, i.e. the workflow does not run for every PR. */
function pullRequestPathFiltered(text) {
  const lines = text.split(/\r?\n/);
  let inOn = false;
  let inPr = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    if (!inOn) {
      if (/^on:\s*$/.test(line)) inOn = true;
      continue;
    }
    if (indent === 0) break; // next top-level key ends the `on:` block
    if (indent === 2) {
      inPr = /^pull_request(_target)?:/.test(trimmed);
      continue;
    }
    if (inPr && /^(paths|paths-ignore):/.test(trimmed)) return true;
  }
  return false;
}

/** Minimal extraction of workflow `name:`, jobs, and matrix values.
 *
 * Check-run naming rules being modelled:
 * - A job with no matrix reports as "<workflow name> / <job id>".
 * - A job with a `matrix:` and NO explicit job `name:` reports as
 *   "<workflow name> / <job id> (<matrix values>)" - one per matrix entry,
 *   with multiple keys joined ", " in definition order.
 * - A job WITH an explicit `name:` reports "<workflow name> / <name>", with
 *   any `${{ matrix.<key> }}` reference expanded per value: GitHub expands
 *   matrix variables in job names (CodeQL's live "Analyze
 *   (javascript-typescript)" check-run is the example).
 * - BP-P3-004: a job WITH an explicit `name:` that does NOT reference every
 *   matrix key still gets the remaining values appended in parentheses -
 *   `name: Build` + `node-version: [18.x, 20.x]` emits "Build (18.x)" and
 *   "Build (20.x)", not a bare "Build". The old model only expanded
 *   `${{ matrix.* }}` references, so a required context written as
 *   "Build (20.x)" was reported as MISSING and a bare "Build" as OK.
 */
function parseWorkflow(text) {
  const lines = text.split(/\r?\n/);
  let workflowName = null;
  const jobs = [];
  let inJobs = false;
  let current = null;
  let section = null; // "matrix" while inside a matrix block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = line.length - line.trimStart().length;

    if (workflowName === null) {
      const m = /^name:\s*(.+?)\s*$/.exec(line);
      if (m) workflowName = m[1].replace(/^["']|["']$/g, "");
      continue;
    }
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (!inJobs) continue;

    const jobMatch = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (jobMatch) {
      if (current) jobs.push(current);
      current = { id: jobMatch[1], name: null, matrix: [] };
      section = null;
      continue;
    }
    if (!current) continue;

    if (/^ {4}name:\s*(.+?)\s*$/.test(line)) {
      current.name = line.trim().replace(/^name:\s*/, "").replace(/^["']|["']$/g, "");
      continue;
    }
    if (/^ {4}strategy:\s*$/.test(line)) {
      section = "strategy";
      continue;
    }
    if (section === "strategy" && /^ {6}matrix:\s*$/.test(line)) {
      section = "matrix";
      continue;
    }
    if (section === "matrix") {
      if (indent <= 6 && line.trim() !== "") {
        section = null;
      } else {
        // e.g. "        node-version: [20.x]"
        const m = /^ {8}([A-Za-z0-9_-]+):\s*\[(.*?)\]\s*$/.exec(line);
        if (m) {
          const values = m[2]
            .split(",")
            .map((v) => v.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
          if (values.length) current.matrix.push({ key: m[1], values });
        }
      }
    }
  }
  if (current) jobs.push(current);
  return { workflowName, jobs };
}

/** Cartesian product of the parsed matrix keys, one object per combination. */
function matrixCombinations(matrix) {
  let combos = [{}];
  for (const { key, values } of matrix) {
    const next = [];
    for (const combo of combos) {
      for (const value of values) next.push({ ...combo, [key]: value });
    }
    combos = next;
  }
  return combos;
}

/** Every check-run name a parsed job emits (see parseWorkflow rules). */
function emittedNames(job) {
  const base = job.name ?? job.id;
  if (!job.matrix.length) return [base];

  const referenced = new Set(
    job.matrix
      .map(({ key }) => key)
      .filter((key) => new RegExp(`\\$\\{\\{\\s*matrix\\.${key}\\s*\\}\\}`).test(base)),
  );

  return matrixCombinations(job.matrix).map((combo) => {
    let name = base;
    for (const { key } of job.matrix) {
      if (!referenced.has(key)) continue;
      const ref = new RegExp(`\\$\\{\\{\\s*matrix\\.${key}\\s*\\}\\}`, "g");
      name = name.replace(ref, () => combo[key]);
    }
    const appended = job.matrix
      .filter(({ key }) => !referenced.has(key))
      .map(({ key }) => combo[key]);
    return appended.length ? `${name} (${appended.join(", ")})` : name;
  });
}

const emitted = new Map(); // check-run name -> source file
const pathFiltered = new Set(); // workflow files with a filtered pull_request
const files = (await readdir(WF_DIR)).filter((f) => /\.ya?ml$/.test(f));
for (const f of files) {
  const text = await readFile(join(WF_DIR, f), "utf8");
  if (pullRequestPathFiltered(text)) pathFiltered.add(f);
  const { workflowName, jobs } = parseWorkflow(text);
  if (!workflowName) continue;
  for (const job of jobs) {
    for (const name of emittedNames(job)) {
      emitted.set(`${workflowName} / ${name}`, f);
    }
  }
}

let bpFiles = [];
try {
  bpFiles = (await readdir(BP_DIR)).filter((f) => f.endsWith(".json"));
} catch {
  console.error(`error: cannot read ${BP_DIR}`);
  process.exit(2);
}

let failures = 0;
for (const f of bpFiles) {
  const bp = JSON.parse(await readFile(join(BP_DIR, f), "utf8"));
  const contexts = bp?.required_status_checks?.contexts ?? [];
  const branch = f.replace(/\.json$/, "");

  for (const ctx of contexts) {
    if (!emitted.has(ctx)) {
      failures++;
      console.error(
        `  MISSING ${branch}: "${ctx}" is required but no workflow emits it`,
      );
      const hints = [...emitted.keys()].filter((k) =>
        k.toLowerCase().includes(ctx.toLowerCase().split(" ")[0]),
      );
      if (hints.length) console.error(`          did you mean: ${hints.join(", ")}`);
      continue;
    }
    const source = emitted.get(ctx);
    if (pathFiltered.has(source)) {
      failures++;
      console.error(
        `  FILTERED ${branch}: "${ctx}" is required, but ${source} path-filters its pull_request trigger`,
      );
      console.error(
        "           a PR that misses those paths never reports this check, so it can never merge",
      );
      continue;
    }
    console.log(`  OK      ${branch}: "${ctx}" <- ${source}`);
  }
}

console.log(
  `\nchecked ${bpFiles.length} branch-protection file(s) against ${emitted.size} check-run name(s)`,
);

if (failures > 0) {
  console.error(
    `\nFAIL: ${failures} required check(s) are missing, renamed, or path-filtered.`,
  );
  if (!WARN_ONLY) process.exit(1);
  console.error("(--warn: not failing the build)");
} else {
  console.log("PASS: all required checks match a workflow job.");
}
