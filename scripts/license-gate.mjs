#!/usr/bin/env node
/**
 * License allow/deny gate with documented exceptions.
 *
 * Why this exists (audit finding SBOM-P1-001, run 20261002-0344):
 * `dependency-review.yml` only gated vulnerability severity, so a GPL/AGPL/
 * SSPL dependency could merge undetected, and the copyleft-adjacent licenses
 * already in the tree were neither surfaced nor approved.
 *
 * Policy: security/license-policy.json. A license string passes only when:
 *   - it is an allowed permissive license (or a pure SPDX expression of them), and
 *   - it contains no denied license, and
 *   - any restricted license is an exact, reviewed entry in `exceptions`.
 *
 * Usage:
 *   pnpm licenses list --json > licenses.json
 *   node scripts/license-gate.mjs [licenses.json]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const POLICY = JSON.parse(
  readFileSync(resolve(ROOT, "security/license-policy.json"), "utf8"),
);
const INPUT = resolve(ROOT, process.argv[2] ?? "licenses.json");

if (!existsSync(INPUT)) {
  console.error(
    `license-gate: ${INPUT} not found. Run "pnpm licenses list --json > licenses.json" first.`,
  );
  process.exit(2);
}

const allowed = new Set(POLICY.allowedLicenses);
const denied = new Set(POLICY.deniedLicenses);
const exceptions = new Map(
  (POLICY.exceptions ?? []).map((entry) => [entry.license, entry]),
);

/** Strip a license expression down to its leaf tokens. */
function tokens(expression) {
  return expression
    .replace(/[()]/g, " ")
    .split(/\s+(?:AND|OR|WITH)\s+|\s+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

function classify(license) {
  if (exceptions.has(license)) return { ok: true, kind: "exception" };
  if (allowed.has(license)) return { ok: true, kind: "allowed" };
  if (denied.has(license)) return { ok: false, kind: "denied", token: license };
  // Expressions: every leaf must be allowed (or exception), and no leaf denied.
  const leaf = tokens(license);
  if (leaf.length > 1) {
    for (const token of leaf) {
      if (denied.has(token)) return { ok: false, kind: "denied", token };
      if (!allowed.has(token) && !exceptions.has(token)) {
        return { ok: false, kind: "unknown", token };
      }
    }
    return { ok: true, kind: "allowed-expression" };
  }
  return { ok: false, kind: "unknown", token: license };
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

const inventory = readJson(INPUT);
const packagesByLicense = Object.entries(inventory);

const violations = [];
const exceptionHits = [];
const usedExceptions = new Set();

for (const [license, packages] of packagesByLicense) {
  const verdict = classify(license);
  if (verdict.ok && verdict.kind === "exception") {
    usedExceptions.add(license);
    for (const pkg of packages) {
      exceptionHits.push({ license, name: pkg.name, versions: pkg.versions });
    }
  } else if (!verdict.ok) {
    for (const pkg of packages) {
      violations.push({
        license,
        token: verdict.token,
        kind: verdict.kind,
        name: pkg.name,
        versions: pkg.versions,
      });
    }
  }
}

// Flag exceptions that are configured but no longer present (policy drift).
const staleExceptions = [...exceptions.keys()].filter((l) => !usedExceptions.has(l));

console.log(`License gate: ${packagesByLicense.length} distinct license string(s) scanned.`);

if (exceptionHits.length) {
  console.log("\nAccepted exceptions in use:");
  for (const hit of exceptionHits) {
    const entry = exceptions.get(hit.license);
    console.log(
      `  ${hit.license} — ${hit.name}@${hit.versions.join(",")} (accepted: ${entry.reason})`,
    );
  }
}

if (staleExceptions.length) {
  console.log(
    `\n::warning::Exception(s) configured but no longer present (remove them): ${staleExceptions.join(", ")}`,
  );
}

if (violations.length) {
  console.error(`\nFAIL: ${violations.length} package(s) use a non-approved license:`);
  for (const violation of violations.slice(0, 50)) {
    console.error(
      `  ${violation.kind.toUpperCase()} ${violation.license} (via ${violation.token}) ` +
        `— ${violation.name}@${violation.versions.join(",")}`,
    );
  }
  console.error(
    "\nEither replace the dependency or add a reviewed entry to security/license-policy.json " +
      "and docs/LICENSE_POLICY.md.",
  );
  process.exit(1);
}

console.log("\nPASS: every resolved package uses an allowed license or a documented exception.");
