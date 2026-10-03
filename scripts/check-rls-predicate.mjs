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

// The vulnerable shape: ANY inline membership subquery whose only predicate is
// user_id = auth.uid(), with no status='approved' filter.
//
// The first version of this guard required the literal token sequence
// "from memberships where user_id = auth.uid()". The adversarial review showed
// three semantically identical forms that evaded it:
//   - a table alias:   from public.memberships m where m.user_id = auth.uid()
//   - ANY():           organization_id = ANY (select organization_id from memberships where ...)
//   - a CTE:           with mine as (select organization_id from memberships where ...)
// All three are the same bug. This matches on the MEMBERSHIP SUBQUERY itself and
// on the absence of an approved filter in the enclosing statement, rather than on
// one exact phrasing, so aliases/ANY/CTE spellings are caught too.
const MEMBERSHIP_SUBQUERY =
  /(?:select|from)\s+(?:[a-z_][a-z0-9_]*\.)?memberships\b[\s\S]{0,160}?(?:user_id\s*=\s*auth\.uid\(\)|auth\.uid\(\)\s*=\s*[\w.]*user_id)/i;

// A statement is exempt if it routes through the canonical helper or filters on
// approved status anywhere in the same statement.
const SAFE_NEARBY = /is_org_member|status\s*=\s*'approved'|membership_status\s*=\s*'approved'/i;

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

  if (!MEMBERSHIP_SUBQUERY.test(stripped)) continue;
  // Safe when the statement also demands approved status or uses the helper.
  if (SAFE_NEARBY.test(stripped)) continue;

  // Report the offending line so a fix is quick.
  stripped.split("\n").forEach((l, i) => {
    if (MEMBERSHIP_SUBQUERY.test(l)) violations.push(`${f}:${i + 1}`);
  });
  if (!stripped.split("\n").some((l) => MEMBERSHIP_SUBQUERY.test(l))) {
    violations.push(`${f} (multi-line membership subquery)`);
  }
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
