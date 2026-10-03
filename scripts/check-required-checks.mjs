#!/usr/bin/env node
/**
 * Guard: every required status check in .github/branch-protection/*.json must
 * be a check-run name that some workflow actually emits.
 *
 * Why this exists (audit findings CI-P1-002 / BP-P1-001, run 20261002-0344):
 * when a required context does not match a real check-run, GitHub shows the
 * check as "Expected — Waiting for status to be reported" forever, so the PR
 * can never satisfy branch protection. Worse, a context like "Dependency
 * Review" (workflow name, not the emitted "Dependency Review / review") used to
 * be treated as an app-level status, so it could be silently satisfied by any
 * app publishing that name instead of running the actual workflow.
 *
 * Usage:
 *   node scripts/check-required-checks.mjs            # fail on any gap
 *   node scripts/check-required-checks.mjs --warn     # report, exit 0
 *
 * Wired into CI via .github/workflows/validate.yml.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const WF_DIR = ".github/workflows";
const BP_DIR = ".github/branch-protection";
const WARN_ONLY = process.argv.includes("--warn");

/** Minimal extraction of workflow `name:`, jobs, and matrix values.
 *
 * Check-run naming rules being modelled:
 * - A job with a `matrix:` and NO explicit job `name:` reports as
 *   "<workflow name> / <job id> (<matrix value>)" - one per matrix entry.
 * - A job WITH an explicit `name:` keeps that literal string (matrix vars are
 *   not expanded in the job name by GitHub).
 * - A job with no matrix reports as "<workflow name> / <job id>".
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
        const m = /^ {8}[A-Za-z0-9_-]+:\s*\[(.*?)\]\s*$/.exec(line);
        if (m) {
          for (const v of m[1].split(",")) {
            const val = v.trim().replace(/^["']|["']$/g, "");
            if (val) current.matrix.push(val);
          }
        }
      }
    }
  }
  if (current) jobs.push(current);
  return { workflowName, jobs };
}

const emitted = new Map(); // check-run name -> source file
const files = (await readdir(WF_DIR)).filter((f) => /\.ya?ml$/.test(f));
for (const f of files) {
  const text = await readFile(join(WF_DIR, f), "utf8");
  const { workflowName, jobs } = parseWorkflow(text);
  if (!workflowName) continue;
  for (const job of jobs) {
    if (job.name) {
      emitted.set(`${workflowName} / ${job.name}`, f);
    } else if (job.matrix.length) {
      for (const v of job.matrix) {
        emitted.set(`${workflowName} / ${job.id} (${v})`, f);
      }
    } else {
      emitted.set(`${workflowName} / ${job.id}`, f);
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
    if (emitted.has(ctx)) {
      console.log(`  OK      ${branch}: "${ctx}" <- ${emitted.get(ctx)}`);
    } else {
      failures++;
      console.error(
        `  MISSING ${branch}: "${ctx}" is required but no workflow emits it`,
      );
      const hints = [...emitted.keys()].filter((k) =>
        k.toLowerCase().includes(ctx.toLowerCase().split(" ")[0]),
      );
      if (hints.length) console.error(`          did you mean: ${hints.join(", ")}`);
    }
  }
}

console.log(
  `\nchecked ${bpFiles.length} branch-protection file(s) against ${emitted.size} check-run name(s)`,
);

if (failures > 0) {
  console.error(`\nFAIL: ${failures} required check(s) do not match any workflow.`);
  if (!WARN_ONLY) process.exit(1);
  console.error("(--warn: not failing the build)");
} else {
  console.log("PASS: all required checks match a workflow job.");
}
