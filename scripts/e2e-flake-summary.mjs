#!/usr/bin/env node
/**
 * Summarise Playwright results for CI (TEST-P2-003).
 *
 * Reads the JSON reporter output and writes pass/flake/fail counts plus every
 * flaky test (passed only after a retry) to the GitHub job summary. Flake is
 * visible data, not (yet) a gate, so this never fails the job — it only warns.
 *
 * Usage: node scripts/e2e-flake-summary.mjs [path-to-results.json]
 */
import { appendFileSync, readFileSync } from "node:fs";

const path = process.argv[2] ?? ".playwright-results/results.json";

function collectSpecs(suites) {
  const specs = [];
  const visit = (suite, file) => {
    const suiteFile = suite.file ?? file;
    for (const child of suite.suites ?? []) visit(child, suiteFile);
    for (const spec of suite.specs ?? []) {
      specs.push({ file: suiteFile, title: spec.title, tests: spec.tests ?? [] });
    }
  };
  for (const suite of suites) visit(suite, suite.file);
  return specs;
}

let report;
try {
  report = JSON.parse(readFileSync(path, "utf8"));
} catch (error) {
  console.log(`e2e flake summary: no readable report at ${path} (${error.message})`);
  process.exit(0);
}

const stats = report.stats ?? {};
const flaky = collectSpecs(report.suites ?? []).filter((spec) =>
  spec.tests.some((test) => test.status === "flaky"),
);

const lines = [
  "## E2E flake summary",
  "",
  "| Metric | Count |",
  "| --- | ---: |",
  `| Passed (no retry needed) | ${stats.expected ?? 0} |`,
  `| Flaky (passed only on retry) | ${stats.flaky ?? 0} |`,
  `| Failed (unexpected) | ${stats.unexpected ?? 0} |`,
  `| Skipped | ${stats.skipped ?? 0} |`,
  "",
];

if (flaky.length > 0) {
  lines.push("### Flaky tests (retried then passed)", "");
  for (const spec of flaky) {
    const retries = Math.max(...spec.tests.map((test) => (test.results ?? []).length - 1));
    lines.push(`- \`${spec.file}\` — ${spec.title} (${retries} retry/retries)`);
  }
  lines.push("");
  lines.push(
    "A flaky pass still counts as green today; record the cause and fix the wait in the spec (see docs/testing.md).",
  );
  lines.push("");
}

const summary = lines.join("\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}
console.log(summary);

if (flaky.length > 0) {
  // GitHub annotation so the flake count is visible in the checks UI too.
  console.log(`::warning::E2E flake: ${flaky.length} test(s) passed only after a retry`);
}
