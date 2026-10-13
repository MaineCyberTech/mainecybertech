#!/usr/bin/env node
/**
 * Shared evaluation logic for the supply-chain policy gates.
 *
 * Why this exists (audit findings SBOM-P2-009 / SBOM-P2-010):
 * the license gate matched exceptions by license string only, so the
 * documented per-package scope was not enforced and the `UNKNOWN` exception
 * was a blanket pass for every unlicensed package; and neither gate read the
 * `expires` field at all. Both behaviours now live here so the gates and
 * their fixture self-test (scripts/ci/check-supply-chain-gates.mjs) exercise
 * the same code:
 *
 *   - exceptions/allowlist entries are matched on (license, package) and are
 *     only valid until their `expires` date;
 *   - a missing or malformed `expires` fails closed;
 *   - `UNKNOWN` fails unless the exact package is named in an exception.
 *
 * Nothing here touches the filesystem or the network.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

export const rank = (severity) => RANK[String(severity).toLowerCase()] ?? 0;

export const atLeast = (severity, threshold) => rank(severity) >= rank(threshold);

/** Today as YYYY-MM-DD (UTC) — the clock the gates compare `expires` against. */
export function todayUTC(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Validate an exception/allowlist entry's review date.
 * Fail closed: a missing or malformed date is not a valid acceptance, and a
 * date before `today` has lapsed.
 */
export function expiryStatus(entry, today = todayUTC()) {
  const expires = typeof entry?.expires === "string" ? entry.expires.trim() : "";
  if (!DATE_RE.test(expires)) {
    return {
      ok: false,
      expires: null,
      reason: "missing or invalid `expires` (YYYY-MM-DD required)",
    };
  }
  if (expires < today) {
    return { ok: false, expires, reason: `expired on ${expires}` };
  }
  return { ok: true, expires, reason: "" };
}

/** Split an SPDX expression into its leaf tokens. */
export function tokens(expression) {
  return String(expression)
    .replace(/[()]/g, " ")
    .split(/\s+(?:AND|OR|WITH)\s+|\s+/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

const key = (license, name) => `${license}\u0000${name}`;

/**
 * Evaluate a license inventory against the policy.
 *
 * @param {Record<string, Array<{name: string, versions?: string[]}>>} inventory
 *   `licenses.json` shape: license string -> packages.
 * @param {object} policy `security/license-policy.json` shape.
 * @param {string} today YYYY-MM-DD; overridable for fixtures.
 * @returns {{distinctLicenses: number, packages: number, exceptions: object[],
 *   exceptionHits: object[], violations: object[], staleExceptions: object[],
 *   expiredExceptions: object[]}}
 */
export function evaluateLicenses(inventory, policy, today = todayUTC()) {
  const allowed = new Set(policy.allowedLicenses ?? []);
  const denied = new Set(policy.deniedLicenses ?? []);
  const exceptions = (policy.exceptions ?? []).map((entry) => ({
    license: String(entry.license ?? ""),
    packages: Array.isArray(entry.packages) ? entry.packages.map(String) : [],
    reason: String(entry.reason ?? ""),
    expiry: expiryStatus(entry, today),
  }));

  const byLicense = new Map();
  for (const entry of exceptions) {
    if (!byLicense.has(entry.license)) byLicense.set(entry.license, []);
    byLicense.get(entry.license).push(entry);
  }

  // (license, package) pairs an exception actually covered.
  const covered = new Set();
  const exceptionHits = [];
  const violations = [];

  const exceptionFor = (license, name) =>
    (byLicense.get(license) ?? []).find((entry) => entry.packages.includes(name));

  const recordHit = (entry, name, versions, token) => {
    if (covered.has(key(entry.license, name))) return;
    covered.add(key(entry.license, name));
    exceptionHits.push({
      license: entry.license,
      token,
      name,
      versions,
      reason: entry.reason,
      expires: entry.expiry.expires,
    });
  };

  const leafVerdict = (license, name) => {
    const entry = exceptionFor(license, name);
    if (entry) {
      if (entry.expiry.ok) return { ok: true, kind: "exception", entry };
      return {
        ok: false,
        kind: "expired-exception",
        token: license,
        entry,
        reason: entry.expiry.reason,
      };
    }
    if (allowed.has(license)) return { ok: true, kind: "allowed" };
    if (denied.has(license)) return { ok: false, kind: "denied", token: license };
    if (byLicense.has(license)) {
      return {
        ok: false,
        kind: "out-of-scope",
        token: license,
        scopedTo: byLicense.get(license).flatMap((candidate) => candidate.packages),
      };
    }
    return { ok: false, kind: "unknown", token: license };
  };

  const classify = (license, name, versions) => {
    // A full-string exception (e.g. a compound expression) wins when scoped to
    // this package.
    const direct = exceptionFor(license, name);
    if (direct) {
      if (direct.expiry.ok) {
        recordHit(direct, name, versions, license);
        return { ok: true, kind: "exception" };
      }
      return {
        ok: false,
        kind: "expired-exception",
        token: license,
        entry: direct,
        reason: direct.expiry.reason,
      };
    }
    if (allowed.has(license)) return { ok: true, kind: "allowed" };
    if (denied.has(license)) return { ok: false, kind: "denied", token: license };
    const leaves = tokens(license);
    if (leaves.length > 1) {
      for (const token of leaves) {
        const verdict = leafVerdict(token, name);
        if (!verdict.ok) return verdict;
        if (verdict.kind === "exception") recordHit(verdict.entry, name, versions, token);
      }
      return { ok: true, kind: "allowed-expression" };
    }
    return leafVerdict(license, name);
  };

  const packagesByLicense = Object.entries(inventory);
  let packageCount = 0;
  for (const [license, packages] of packagesByLicense) {
    for (const pkg of packages ?? []) {
      packageCount += 1;
      const verdict = classify(license, pkg.name, pkg.versions ?? []);
      if (!verdict.ok) {
        violations.push({
          license,
          token: verdict.token,
          kind: verdict.kind,
          name: pkg.name,
          versions: pkg.versions ?? [],
          reason: verdict.reason,
          scopedTo: verdict.scopedTo,
        });
      }
    }
  }

  // Policy drift: an entry none of whose packages were seen (per-package
  // staleness inside a used entry is expected for platform-specific deps).
  const staleExceptions = exceptions
    .filter((entry) => !entry.packages.some((name) => covered.has(key(entry.license, name))))
    .map((entry) => ({
      license: entry.license,
      packages: entry.packages,
      unusedPackages: entry.packages.filter((name) => !covered.has(key(entry.license, name))),
    }));

  const expiredExceptions = exceptions.filter((entry) => !entry.expiry.ok);

  return {
    distinctLicenses: packagesByLicense.length,
    packages: packageCount,
    exceptions,
    exceptionHits,
    violations,
    staleExceptions,
    expiredExceptions,
  };
}

/**
 * Evaluate `pnpm audit` findings against the dependency-audit policy.
 *
 * An allowlist entry only suppresses a finding while its `expires` date is
 * valid; a lapsed (or date-less) entry never suppresses, and is itself a
 * violation so the accepted risk cannot silently outlive its review.
 *
 * @param {object[]} findings Advisory descriptors (id, severity, scope, module,
 *   vulnerable, patched).
 * @param {object} policy `security/dependency-audit-policy.json` shape.
 * @param {string} today YYYY-MM-DD; overridable for fixtures.
 */
export function evaluateAudit(findings, policy, today = todayUTC()) {
  const severityPolicy = policy.severityPolicy ?? {};
  const allowlist = new Map((policy.allowlist ?? []).map((entry) => [String(entry.id), entry]));

  const evaluated = findings.map((finding) => {
    const entry = allowlist.get(String(finding.id));
    const expiry = entry ? expiryStatus(entry, today) : null;
    return {
      ...finding,
      allowlist: entry && expiry.ok ? entry : undefined,
      lapsedAllowlist: entry && !expiry.ok ? { ...entry, expiryReason: expiry.reason } : undefined,
    };
  });

  const violations = [];
  for (const finding of evaluated) {
    if (finding.allowlist) continue;
    if (finding.lapsedAllowlist) {
      // The acceptance lapsed: fail even when the severity thresholds alone
      // would only report it.
      violations.push(finding);
      continue;
    }
    if (atLeast(finding.severity, severityPolicy.blockAtOrAboveAnyScope)) {
      violations.push(finding);
    } else if (
      finding.scope === "prod" &&
      atLeast(finding.severity, severityPolicy.blockAtOrAboveProd)
    ) {
      violations.push(finding);
    }
  }

  const allowlisted = evaluated.filter((finding) => finding.allowlist);
  const reportedDev = evaluated.filter(
    (finding) =>
      !finding.allowlist &&
      !violations.includes(finding) &&
      finding.scope === "dev" &&
      atLeast(finding.severity, severityPolicy.reportDevAtOrAbove),
  );
  const expiredExceptions = evaluated
    .filter((finding) => finding.lapsedAllowlist)
    .map((finding) => ({
      id: finding.id,
      module: finding.module,
      severity: finding.severity,
      scope: finding.scope,
      ...finding.lapsedAllowlist,
    }));

  return { findings: evaluated, violations, allowlisted, reportedDev, expiredExceptions };
}
