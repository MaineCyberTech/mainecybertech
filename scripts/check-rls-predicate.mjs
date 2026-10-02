#!/usr/bin/env node
/**
 * Guard: no NEW migration may introduce a raw, status-unfiltered membership
 * predicate in an RLS policy.
 *
 * Why this exists (audit DATA-P1-001, run 20261002-0344):
 * the systemic fix in 5302100/5302112/5302129 rewrote the live policies to the
 * approved-aware public.is_org_member() helper, but nothing stopped the next
 * author from writing the raw form again - and that is exactly what happened:
 * 5302402, 5302405, 5302406, 5302412 and 5302414/5302417 each reintroduced it,
 * letting pending/suspended members read tenant rows through the anon-key + JWT
 * path. 5302418 and 5302420 had to fix them again.
 *
 * The raw predicate is:
 *   organization_id in (select organization_id from memberships
 *                       where user_id = auth.uid())
 * with no `status = 'approved'` filter. The safe form is
 * `public.is_org_member(organization_id)`.
 *
 * Migrations are append-only, so HISTORIC files are exempt via a baseline:
 * only migrations newer than the baseline version are checked. The baseline is
 * the last migration before this guard landed; raise it only when a reviewed,
 * deliberate exception is recorded here.
 *
 * Usage:
 *   node scripts/check-rls-predicate.mjs            # fail on any violation
 *   node scripts/check-rls-predicate.mjs --warn     # report, exit 0
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const MIGRATIONS = "supabase/migrations";

// Only files with a numeric version strictly greater than this are enforced.
// Everything at or below it is history that later migrations already fixed.
const BASELINE_VERSION = 5302430;

// The vulnerable predicate: an inline membership subquery with no approved
// filter. Matched on a normalized (whitespace-collapsed) statement.
const RAW_PREDICATE =
  /organization_id\s+in\s*\(\s*select\s+organization_id\s+from\s+(?:public\.)?memberships\s+where\s+user_id\s*=\s*auth\.uid\(\)\s*\)/i;

// A file is exempt if the surrounding statement also filters on approved, or
// routes through the canonical helper.
const SAFE_NEARBY = /is_org_member|status\s*=\s*'approved'/i;

function versionOf(name) {
  const m = /^(\d+)_/.exec(name);
  return m ? Number(m[1]) : null;
}

const warnOnly = process.argv.includes("--warn");

let files;
try {
  files = (await readdir(MIGRATIONS)).filter((f) => f.endsWith(".sql"));
} catch {
  console.error(`error: cannot read ${MIGRATIONS}`);
  process.exit(2);
}

const violations = [];
for (const f of files) {
  const version = versionOf(f);
  if (version === null || version <= BASELINE_VERSION) continue;

  const text = await readFile(join(MIGRATIONS, f), "utf8");
  // Strip line comments so commented-out examples do not trip the guard.
  const stripped = text
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");

  if (!RAW_PREDICATE.test(stripped)) continue;
  if (SAFE_NEARBY.test(stripped) && !RAW_PREDICATE.test(stripped)) continue;

  // Report the offending line numbers for a fast fix.
  const lines = stripped.split("\n");
  lines.forEach((l, i) => {
    if (RAW_PREDICATE.test(l)) {
      violations.push(`${f}:${i + 1}`);
    }
  });
}

if (violations.length === 0) {
  const checked = files.filter((f) => (versionOf(f) ?? 0) > BASELINE_VERSION).length;
  console.log(
    `PASS: no raw status-unfiltered membership predicate in ${checked} migration(s) newer than ${BASELINE_VERSION}.`,
  );
  process.exit(0);
}

console.error("Raw membership predicate (missing status='approved') found in new migrations:");
for (const v of violations) console.error(`  ${v}`);
console.error(
  "\nUse public.is_org_member(organization_id) instead. See migration 5302112 for the" +
    " canonical rewrite and DATA-P1-001 for why this is a tenant-isolation bug.",
);
if (!warnOnly) process.exit(1);
console.error("(--warn: not failing the build)");
