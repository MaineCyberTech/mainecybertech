#!/usr/bin/env node
/**
 * License allow/deny gate with documented, package-scoped exceptions.
 *
 * Why this exists (audit finding SBOM-P1-001, run 20261002-0344):
 * `dependency-review.yml` only gated vulnerability severity, so a GPL/AGPL/
 * SSPL dependency could merge undetected, and the copyleft-adjacent licenses
 * already in the tree were neither surfaced nor approved.
 *
 * Policy: security/license-policy.json. A package passes only when:
 *   - its license string is an allowed permissive license (or a pure SPDX
 *     expression of them), or
 *   - a reviewed exception names BOTH that license string (or one of its SPDX
 *     leaves) and this exact package, and that exception has not expired.
 *
 * Exceptions are matched on (license, package) — SBOM-P2-009: a different
 * package with the same license still fails, and `UNKNOWN` fails unless the
 * package is explicitly listed. A missing/malformed/past `expires` date is a
 * violation (SBOM-P2-010: an accepted risk must not outlive its review).
 *
 * Usage:
 *   node scripts/collect-licenses.mjs --out licenses.json
 *   node scripts/license-gate.mjs [licenses.json] [--policy security/license-policy.json]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { evaluateLicenses } from "./lib/policy-gates.mjs";

const ROOT = resolve(import.meta.dirname, "..");

const args = process.argv.slice(2);
let policyPath = "security/license-policy.json";
const rest = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--policy") {
    policyPath = args[i + 1] ?? policyPath;
    i += 1;
  } else {
    rest.push(args[i]);
  }
}

const POLICY = JSON.parse(readFileSync(resolve(ROOT, policyPath), "utf8"));
const INPUT = resolve(ROOT, rest[0] ?? "licenses.json");

if (!existsSync(INPUT)) {
  console.error(
    `license-gate: ${INPUT} not found. Run "node scripts/collect-licenses.mjs --out licenses.json" first.`,
  );
  process.exit(2);
}

/** Read a JSON file, tolerating UTF-8 BOM and UTF-16 (PowerShell `>` output). */
function readJson(path) {
  const buffer = readFileSync(path);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return JSON.parse(buffer.toString("utf16le").replace(/^\uFEFF/, ""));
  }
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    // UTF-16BE: swap bytes to LE before decoding.
    const swapped = Buffer.from(buffer);
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    }
    return JSON.parse(swapped.toString("utf16le").replace(/^\uFEFF/, ""));
  }
  return JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
}

const result = evaluateLicenses(readJson(INPUT), POLICY);

console.log(
  `License gate: ${result.distinctLicenses} distinct license string(s), ` +
    `${result.packages} package(s) scanned.`,
);

if (result.exceptionHits.length) {
  console.log("\nAccepted exceptions in use (package-scoped, unexpired):");
  for (const hit of result.exceptionHits) {
    console.log(
      `  ${hit.license} — ${hit.name}@${hit.versions.join(",")} ` +
        `(expires ${hit.expires}; accepted: ${hit.reason})`,
    );
  }
}

if (result.staleExceptions.length) {
  for (const entry of result.staleExceptions) {
    const unused = entry.unusedPackages.length
      ? ` (no longer present: ${entry.unusedPackages.join(", ")})`
      : "";
    console.log(
      `::warning::Exception for ${entry.license} is configured but no longer present${unused}; remove it.`,
    );
  }
}

// Expired entries that no package relies on are drift, not a violation — the
// ones that are relied on appear in the FAIL list below. Compare on the token
// as well: an exception keyed to an SPDX leaf (e.g. `LGPL-3.0-or-later`) is
// relied on through a compound license string.
const violatedExpired = new Set(
  result.violations
    .filter((violation) => violation.kind === "expired-exception")
    .flatMap((violation) => [violation.license, violation.token]),
);
for (const entry of result.expiredExceptions) {
  if (!violatedExpired.has(entry.license)) {
    console.log(
      `::warning::Exception for ${entry.license} has an invalid/expired date ` +
        `(${entry.expiry.reason}) and accepts nothing.`,
    );
  }
}

if (result.violations.length) {
  console.error(`\nFAIL: ${result.violations.length} package(s) use a non-approved license:`);
  for (const violation of result.violations.slice(0, 50)) {
    const detail =
      violation.kind === "expired-exception"
        ? ` — exception ${violation.reason}`
        : violation.kind === "out-of-scope"
          ? ` — exception only covers: ${violation.scopedTo.join(", ")}`
          : "";
    console.error(
      `  ${violation.kind.toUpperCase()} ${violation.license} (via ${violation.token}) ` +
        `— ${violation.name}@${violation.versions.join(",")}${detail}`,
    );
  }
  console.error(
    "\nEither replace the dependency or add a reviewed entry to security/license-policy.json " +
      "(scoped to the exact package, with an `expires` date in the future) and docs/LICENSE_POLICY.md.",
  );
  process.exit(1);
}

console.log(
  "\nPASS: every resolved package uses an allowed license or a documented, unexpired exception scoped to it.",
);
