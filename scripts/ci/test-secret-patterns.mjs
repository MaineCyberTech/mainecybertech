#!/usr/bin/env node
/**
 * Fixture test for the diff secret scanner (CI-P3-005 / SC-P3-009).
 *
 * `scripts/ci/secret-patterns.txt` is the single pattern list consumed by the
 * CI action and both pre-commit scripts. The positive fixtures are assembled
 * at runtime so this test file does not itself look like a committed secret.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const patterns = readFileSync(join(root, "scripts/ci/secret-patterns.txt"), "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
const fixtures = JSON.parse(
  readFileSync(join(root, "scripts/ci/fixtures/secret-patterns.json"), "utf8"),
);

if (patterns.length === 0) {
  console.error("secret-patterns.txt is empty");
  process.exit(1);
}

let failed = 0;

for (const fixture of fixtures.positive) {
  const pattern = patterns.find((candidate) => candidate.startsWith(fixture.pattern));
  const value = fixture.prefix + fixture.fill.repeat(fixture.bodyLength);
  if (!pattern) {
    console.error(`MISSING pattern for ${fixture.name} (${fixture.pattern})`);
    failed++;
    continue;
  }
  if (!new RegExp(pattern).test(value)) {
    console.error(`NOT DETECTED: ${fixture.name} against ${pattern}`);
    failed++;
    continue;
  }
  console.log(`detected: ${fixture.name}`);
}

const combined = new RegExp(patterns.join("|"));
for (const fixture of fixtures.negative) {
  if (combined.test(fixture.value)) {
    console.error(`FALSE POSITIVE: ${fixture.name}`);
    failed++;
  }
}

// Every scanner must consume the canonical list; a copy-pasted pattern list is
// how the platform token formats went missing in the first place.
const consumers = [
  ".github/actions/secret-scan/action.yml",
  "scripts/scan-secrets.sh",
  "scripts/scan-secrets.ps1",
];
for (const consumer of consumers) {
  const source = readFileSync(join(root, consumer), "utf8");
  if (!source.includes("secret-patterns.txt")) {
    console.error(`NOT WIRED: ${consumer} does not read scripts/ci/secret-patterns.txt`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} secret-pattern fixture(s) failed`);
  process.exit(1);
}
console.log(
  `secret-pattern fixtures OK (${fixtures.positive.length} detected, ` +
    `${fixtures.negative.length} negative)`,
);
