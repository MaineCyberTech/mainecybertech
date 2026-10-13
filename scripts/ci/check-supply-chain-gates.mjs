#!/usr/bin/env node
/**
 * Self-test for the supply-chain policy gates (SBOM-P2-009 / SBOM-P2-010).
 *
 * A policy gate that silently stops enforcing still prints PASS, so this
 * harness runs the real `scripts/license-gate.mjs` against fixture policies
 * and inventories and asserts the expected exit status + reason, then unit-
 * tests `evaluateAudit` (the function `scripts/audit-gate.mjs` uses) with a
 * lapsed allowlist entry:
 *
 *   1. allowed license                          -> PASS
 *   2. exception scoped to the exact package    -> PASS (also when the
 *      exception is keyed to an SPDX leaf inside a compound expression)
 *   3. same license, different package          -> FAIL (OUT-OF-SCOPE)
 *   4. UNKNOWN for an explicitly listed package -> PASS
 *   5. UNKNOWN for an unlisted package          -> FAIL (UNKNOWN)
 *   6. exception past its `expires` date        -> FAIL (EXPIRED-EXCEPTION),
 *      including a leaf-keyed exception in a compound expression
 *   7. denied license                           -> FAIL (DENIED)
 *   8. lapsed audit allowlist entry             -> violation, not suppressed
 *   9. in-date audit allowlist entry            -> still suppressed
 *
 * Usage: node scripts/ci/check-supply-chain-gates.mjs
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { evaluateAudit } from "../lib/policy-gates.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const FIXTURES = resolve(import.meta.dirname, "fixtures/supply-chain");
const LICENSE_GATE = resolve(ROOT, "scripts/license-gate.mjs");

const failures = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok: ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function runLicenseGate(inventory, policy = "license-policy.fixture.json") {
  const args = [LICENSE_GATE, resolve(FIXTURES, inventory), "--policy", resolve(FIXTURES, policy)];
  try {
    const stdout = execFileSync(process.execPath, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output: stdout };
  } catch (error) {
    return {
      code: typeof error.status === "number" ? error.status : 1,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

console.log("1/2 license-gate fixtures (package scope + expiry, SBOM-P2-009/010)");
const pass = runLicenseGate("inventory.pass.json");
check(
  "allowed license + scoped exception + listed UNKNOWN pass",
  pass.code === 0,
  `exit ${pass.code}`,
);
check("scoped exception is reported", pass.output.includes("scoped-pkg"));

const scope = runLicenseGate("inventory.scope-mismatch.json");
check("exception for another package fails", scope.code === 1, `exit ${scope.code}`);
check(
  "failure names the out-of-scope package",
  scope.output.includes("OUT-OF-SCOPE") && scope.output.includes("other-pkg"),
);

const unknown = runLicenseGate("inventory.unknown-unlisted.json");
check("unlisted UNKNOWN fails", unknown.code === 1, `exit ${unknown.code}`);
check("failure names the unlicensed package", unknown.output.includes("mystery-pkg"));

const expired = runLicenseGate("inventory.expired.json");
check("expired exception fails", expired.code === 1, `exit ${expired.code}`);
check("failure says EXPIRED-EXCEPTION", expired.output.includes("EXPIRED-EXCEPTION"));

const expiredExpression = runLicenseGate("inventory.expired-expression.json");
check(
  "expired SPDX-leaf exception fails inside a compound expression",
  expiredExpression.code === 1,
  `exit ${expiredExpression.code}`,
);
check(
  "compound failure says EXPIRED-EXCEPTION",
  expiredExpression.output.includes("EXPIRED-EXCEPTION"),
);

const denied = runLicenseGate("inventory.denied.json");
check("denied license fails", denied.code === 1, `exit ${denied.code}`);
check("failure says DENIED", denied.output.includes("DENIED"));

console.log("2/2 audit-gate evaluation (allowlist expiry, SBOM-P2-010)");
const policy = JSON.parse(readFileSync(resolve(FIXTURES, "audit-policy.fixture.json"), "utf8"));
const findings = [
  {
    id: "GHSA-fixture-lapsed",
    severity: "low",
    scope: "dev",
    module: "fixture-lapsed-pkg",
    vulnerable: "<1.0.0",
    patched: "none",
  },
  {
    id: "GHSA-fixture-valid",
    severity: "low",
    scope: "dev",
    module: "fixture-valid-pkg",
    vulnerable: "<1.0.0",
    patched: "none",
  },
  {
    id: "GHSA-fixture-new",
    severity: "moderate",
    scope: "dev",
    module: "fixture-new-pkg",
    vulnerable: "<1.0.0",
    patched: "1.0.0",
  },
];
const result = evaluateAudit(findings, policy, "2026-10-11");
check(
  "lapsed allowlist entry is a violation",
  result.violations.some((finding) => finding.id === "GHSA-fixture-lapsed"),
);
check(
  "lapsed entry does not suppress",
  result.allowlisted.every((finding) => finding.id !== "GHSA-fixture-lapsed"),
);
check(
  "in-date allowlist entry still suppresses",
  result.allowlisted.some((finding) => finding.id === "GHSA-fixture-valid"),
);
check(
  "expired entry is reported",
  result.expiredExceptions.some((exception) => exception.id === "GHSA-fixture-lapsed"),
);
check("lapsed entry fails even below the severity thresholds", result.violations.length === 1);

if (failures.length) {
  console.error(`\nFAIL: supply-chain gate self-test (${failures.length} assertion(s) failed)`);
  process.exit(1);
}
console.log("\nPASS: supply-chain gates enforce package scope and `expires`");
