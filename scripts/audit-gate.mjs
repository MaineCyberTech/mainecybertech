#!/usr/bin/env node
/**
 * Dependency vulnerability gate with an explicit, documented policy.
 *
 * Why this exists (audit finding SC-P1-001, run 20261002-0344):
 * `pnpm audit --audit-level=high --prod` only sees production dependencies, so
 * a critical/high advisory reachable only through the dev toolchain (Storybook,
 * Playwright, Chromatic, ...) is invisible to CI. This gate audits the *whole*
 * resolved tree and additionally enforces production findings.
 *
 * Policy (see security/dependency-audit-policy.json and docs/DEPENDENCY_POLICY.md):
 *   - any CRITICAL finding, in any scope            -> block
 *   - any HIGH+ finding in production dependencies  -> block
 *   - everything else                                -> report only
 *
 * Known, reviewed exceptions live in the policy allowlist and never block, but
 * are printed so they stay visible (and should carry an expiry).
 *
 * Usage:
 *   node scripts/audit-gate.mjs            # enforce + report
 *   node scripts/audit-gate.mjs --report   # never fail (advisory)
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const POLICY = JSON.parse(
  readFileSync(resolve(ROOT, "security/dependency-audit-policy.json"), "utf8"),
);
const REPORT_ONLY = process.argv.includes("--report");

const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const rank = (severity) => RANK[String(severity).toLowerCase()] ?? 0;
const atLeast = (severity, threshold) => rank(severity) >= rank(threshold);

/** Run `pnpm audit --json`; pnpm exits non-zero when findings exist. */
function audit(args) {
  // A single command string (with shell) works on both Linux CI and the
  // Windows pnpm.cmd shim without the DEP0190 args+shell warning.
  const command = ["pnpm", "audit", "--json", ...args].join(" ");
  try {
    const out = execFileSync(command, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
      shell: true,
    });
    return normalize(out);
  } catch (error) {
    // execFileSync throws on non-zero exit, but stdout still holds the report.
    if (error.stdout) return normalize(error.stdout);
    throw error;
  }
}

function normalize(raw) {
  const parsed = JSON.parse(String(raw).replace(/^\uFEFF/, ""));
  return Object.values(parsed.advisories ?? {});
}

/** Map advisory id -> finding descriptor. */
function index(advisories) {
  const map = new Map();
  for (const advisory of advisories) {
    map.set(String(advisory.github_advisory_id ?? advisory.id), advisory);
  }
  return map;
}

const { blockAtOrAboveProd, blockAtOrAboveAnyScope, reportDevAtOrAbove } =
  POLICY.severityPolicy;

const allowlist = new Map(
  (POLICY.allowlist ?? []).map((entry) => [entry.id, entry]),
);

const full = audit([]);
const prod = audit(["--prod"]);
const prodIds = new Set(index(prod).keys());

function scopeOf(advisory) {
  const id = String(advisory.github_advisory_id ?? advisory.id);
  return prodIds.has(id) ? "prod" : "dev";
}

const findings = [];
for (const advisory of full) {
  const id = String(advisory.github_advisory_id ?? advisory.id);
  const severity = String(advisory.severity).toLowerCase();
  const scope = scopeOf(advisory);
  const allowed = allowlist.get(id);
  findings.push({
    id,
    severity,
    scope,
    module: advisory.module_name,
    vulnerable: advisory.vulnerable_versions,
    patched: advisory.patched_versions,
    allowed,
  });
}

findings.sort(
  (a, b) =>
    rank(b.severity) - rank(a.severity) || a.module.localeCompare(b.module),
);

const violations = [];
for (const finding of findings) {
  if (finding.allowed) continue;
  if (atLeast(finding.severity, blockAtOrAboveAnyScope)) {
    violations.push(finding);
  } else if (finding.scope === "prod" && atLeast(finding.severity, blockAtOrAboveProd)) {
    violations.push(finding);
  }
}

// Human-readable report — always printed so dev-tree advisories are visible.
console.log("Dependency audit (all scopes)");
console.log(`  total findings: ${findings.length}`);
for (const finding of findings) {
  const tag = finding.allowed
    ? "ALLOWLISTED"
    : violations.includes(finding)
      ? "BLOCKING"
      : "reported";
  console.log(
    `  [${tag}] ${finding.severity.toUpperCase()} ${finding.scope} ` +
      `${finding.module}@${finding.vulnerable} -> ${finding.patched} (${finding.id})`,
  );
}

const allowlisted = findings.filter((f) => f.allowed);
if (allowlisted.length) {
  console.log("\nAllowlisted exceptions:");
  for (const finding of allowlisted) {
    console.log(
      `  ${finding.id} ${finding.module} (${finding.scope}, ${finding.severity}) — ${finding.allowed.reason}`,
    );
  }
}

const reportedDev = findings.filter(
  (f) =>
    !f.allowed &&
    !violations.includes(f) &&
    f.scope === "dev" &&
    atLeast(f.severity, reportDevAtOrAbove),
);
if (reportedDev.length) {
  console.log(
    `\n::warning::${reportedDev.length} dev-tree advisory(ies) reported (non-blocking): ` +
      reportedDev.map((f) => `${f.severity} ${f.module}`).join(", "),
  );
}

if (violations.length && !REPORT_ONLY) {
  console.error(
    `\nFAIL: ${violations.length} dependency finding(s) violate the audit policy ` +
      `(block CRITICAL any scope, block ${blockAtOrAboveProd.toUpperCase()}+ prod).`,
  );
  process.exit(1);
}

console.log(
  violations.length
    ? `\n${REPORT_ONLY ? "Report-only: " : ""}${violations.length} policy violation(s) present.`
    : "\nPASS: no dependency finding violates the audit policy.",
);
