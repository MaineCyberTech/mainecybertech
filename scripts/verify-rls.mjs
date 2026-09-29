#!/usr/bin/env node
/**
 * Static RLS / migration hygiene verifier (dependency-free ESM).
 *
 * Scans `supabase/migrations/*.sql` (ordered by numeric filename prefix) and
 * enforces three rules:
 *
 *  1. FAIL if a live table never has a later `alter table X enable row level
 *     security`. Historical exceptions are listed in
 *     `HISTORICAL_NO_RLS_BASELINE` below and reported as warnings instead,
 *     so new tables are gated while the old debt stays visible.
 *  2. WARN if a table has RLS enabled but no `create policy ... on X`
 *     anywhere. Deny-all tables are legitimate (e.g. service-role-only
 *     tables); opt out with a `-- rls: deny-all` comment on or next to the
 *     `enable row level security` statement for that table.
 *  3. FAIL for migrations whose numeric prefix is >= 5302427 (the
 *     going-forward baseline) when a `create policy NAME on TABLE` is not
 *     preceded in the same file by `drop policy if exists NAME on TABLE`.
 *     Earlier history has the known bare-policy debt and is exempt.
 *
 * Identifier quoting (`"name"`, `'name'`), `if not exists`, `public.`
 * prefixes and multi-line statements are normalized. Comments are masked
 * before matching so commented-out DDL is ignored; dynamic `execute
 * format('... %I ...')` policy statements (placeholders) are not counted.
 *
 * The scan is exposed as `collectRlsStats()` (used by
 * `scripts/check-docs-counts.mjs` to guard the counts the docs state); the
 * module also runs as a CLI when invoked directly.
 *
 * Usage:
 *   node scripts/verify-rls.mjs [--warn-only]
 *
 * Exits 1 only when rule 1 (non-baseline tables) or rule 3 fails; with
 * `--warn-only` it always exits 0 (failures and warnings are still printed).
 *
 * Historical baseline (recorded 2026-09-27): a full scan of the existing
 * migrations found that every live table enables RLS, so
 * HISTORICAL_NO_RLS_BASELINE is intentionally empty. If a future scan shows
 * pre-existing tables that cannot be fixed immediately, list them here so
 * they warn instead of failing CI — but never add a new table to this set;
 * every new table must enable RLS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

const POLICY_DROP_BASELINE_VERSION = 5302427;

const HISTORICAL_NO_RLS_BASELINE = new Set([
  // Intentionally empty — see the header note.
]);

const DENY_ALL_MARKER = /--\s*rls:\s*deny-all/i;
const DENY_ALL_WINDOW_LINES = 3;

// ---------------------------------------------------------------------------
// SQL matching helpers
// ---------------------------------------------------------------------------

// A quoted or bare identifier: groups are (double-quoted, single-quoted, bare).
const IDENT = String.raw`(?:"([^"]+)"|'([^']+)'|([A-Za-z_][A-Za-z0-9_$]*))`;
// An optionally schema-qualified identifier: groups 1-3 schema, 4-6 name.
const QUALIFIED = String.raw`(?:${IDENT}\s*\.\s*)?${IDENT}`;

const CREATE_TABLE_RE = new RegExp(
  String.raw`create\s+(?:unlogged\s+|temporary\s+|temp\s+)?table\s+(?:if\s+not\s+exists\s+)?${QUALIFIED}`,
  "gi",
);
const DROP_TABLE_RE = new RegExp(String.raw`drop\s+table\s+(?:if\s+exists\s+)?${QUALIFIED}`, "gi");
const ENABLE_RLS_RE = new RegExp(
  String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${QUALIFIED}\s+enable\s+row\s+level\s+security`,
  "gi",
);
const DISABLE_RLS_RE = new RegExp(
  String.raw`alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?${QUALIFIED}\s+disable\s+row\s+level\s+security`,
  "gi",
);
// Groups 1-3 policy name, 4-6 schema, 7-9 table.
const CREATE_POLICY_RE = new RegExp(
  String.raw`create\s+policy\s+(?:if\s+not\s+exists\s+)?${IDENT}\s+on\s+${QUALIFIED}`,
  "gi",
);
const DROP_POLICY_RE = new RegExp(
  String.raw`drop\s+policy\s+(?:if\s+exists\s+)?${IDENT}\s+on\s+${QUALIFIED}`,
  "gi",
);

function ident(...groups) {
  for (const g of groups) {
    if (typeof g === "string" && g.length > 0) {
      return g.trim().toLowerCase().replace(/\s+/g, " ");
    }
  }
  return null;
}

function blank(s) {
  return s.replace(/[^\n]/g, " ");
}

// Replace comments with spaces (preserving newlines/offsets) so commented-out
// DDL is never analyzed. Strings are left intact so quoted policy names work.
function maskComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/--[^\n]*/g, blank);
}

function lineNumberAt(raw, index) {
  return raw.slice(0, index).split("\n").length;
}

// ---------------------------------------------------------------------------
// Scan migrations
// ---------------------------------------------------------------------------

/**
 * Runs the static scan over `supabase/migrations/*.sql`.
 *
 * @returns {{ tables: number, rlsEnabled: number, policies: number,
 *   failures: string[], warnings: string[] }}
 *   `tables` is the number of live (created and not dropped) tables,
 *   `rlsEnabled` how many of them enable RLS, `policies` the number of
 *   `create policy` statements found, and `failures`/`warnings` the
 *   human-readable findings (rule 1/3 failures and rule 2/baseline warnings).
 */
export function collectRlsStats() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d.*\.sql$/i.test(f))
    .sort((a, b) => {
      const pa = Number.parseInt(a.match(/^(\d+)/)?.[1] ?? "0", 10);
      const pb = Number.parseInt(b.match(/^(\d+)/)?.[1] ?? "0", 10);
      return pa - pb || a.localeCompare(b);
    });

  const events = [];
  const policies = []; // { file, prefix, line, pos, name, table }
  const policyTables = new Set(); // tables that ever receive a create policy

  for (const file of files) {
    const prefix = Number.parseInt(file.match(/^(\d+)/)?.[1] ?? "0", 10);
    const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
    const masked = maskComments(raw);
    const rawLines = raw.split("\n");
    const fileEvents = [];

    for (const m of masked.matchAll(CREATE_TABLE_RE)) {
      const table = ident(m[4], m[5], m[6]);
      if (table) fileEvents.push({ kind: "create", table, pos: m.index, file });
    }
    for (const m of masked.matchAll(DROP_TABLE_RE)) {
      const table = ident(m[4], m[5], m[6]);
      if (table) fileEvents.push({ kind: "drop", table, pos: m.index, file });
    }
    for (const m of masked.matchAll(ENABLE_RLS_RE)) {
      const table = ident(m[4], m[5], m[6]);
      if (!table) continue;
      const line = lineNumberAt(raw, m.index);
      const from = Math.max(0, line - 1 - DENY_ALL_WINDOW_LINES);
      const to = Math.min(rawLines.length, line + DENY_ALL_WINDOW_LINES);
      const denyAllNear = rawLines.slice(from, to).some((l) => DENY_ALL_MARKER.test(l));
      fileEvents.push({ kind: "enable", table, pos: m.index, file, line, denyAllNear });
    }
    for (const m of masked.matchAll(DISABLE_RLS_RE)) {
      const table = ident(m[4], m[5], m[6]);
      if (table) fileEvents.push({ kind: "disable", table, pos: m.index, file });
    }

    for (const m of masked.matchAll(CREATE_POLICY_RE)) {
      const name = ident(m[1], m[2], m[3]);
      const table = ident(m[7], m[8], m[9]);
      // `execute format('create policy "%s_..." on public.%I')` — placeholders
      // never match the table identifier, but guard the policy name too.
      if (!name || !table || name.includes("%") || table.includes("%")) continue;
      const line = lineNumberAt(raw, m.index);
      policies.push({ file, prefix, line, pos: m.index, name, table });
      policyTables.add(table);
    }

    fileEvents.sort((a, b) => a.pos - b.pos);
    events.push(...fileEvents);
  }

  // -------------------------------------------------------------------------
  // Check 1 — live tables must have RLS (with a historical baseline demoted to
  // warnings), plus check 2 — RLS tables without any policy
  // -------------------------------------------------------------------------

  const tableState = new Map();
  function stateOf(table) {
    if (!tableState.has(table)) {
      tableState.set(table, {
        live: false,
        rls: false,
        denyAll: false,
        createdIn: null,
        lastEnable: null,
      });
    }
    return tableState.get(table);
  }

  for (const ev of events) {
    const st = stateOf(ev.table);
    if (ev.kind === "create") {
      st.live = true;
      st.rls = false;
      st.createdIn = ev.file;
    } else if (ev.kind === "drop") {
      st.live = false;
      st.rls = false;
      st.denyAll = false;
    } else if (ev.kind === "enable") {
      st.rls = true;
      st.lastEnable = { file: ev.file, line: ev.line };
      if (ev.denyAllNear) st.denyAll = true;
    } else if (ev.kind === "disable") {
      st.rls = false;
    }
  }

  const failures = [];
  const warnings = [];
  let rlsEnabledCount = 0;

  for (const [table, st] of [...tableState.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!st.live) continue;
    if (st.rls) {
      rlsEnabledCount += 1;
      if (!policyTables.has(table) && !st.denyAll) {
        warnings.push(
          `[no-policy] ${table} has RLS enabled (${st.lastEnable.file}:${st.lastEnable.line}) ` +
            `but no create policy targets it (add policies or a "-- rls: deny-all" marker)`,
        );
      }
    } else if (HISTORICAL_NO_RLS_BASELINE.has(table)) {
      warnings.push(
        `[no-rls:baseline] ${table} (created in ${st.createdIn}) has no "enable row level security" — historical debt`,
      );
    } else {
      failures.push(
        `[no-rls] ${table} (created in ${st.createdIn}) never gets "alter table ... enable row level security"`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Check 3 — new migrations must pair every create policy with a drop policy
  // -------------------------------------------------------------------------

  const policiesByFile = new Map();
  for (const p of policies) {
    if (!policiesByFile.has(p.file)) policiesByFile.set(p.file, []);
    policiesByFile.get(p.file).push(p);
  }

  for (const [file, filePolicies] of policiesByFile) {
    const prefix = filePolicies[0].prefix;
    if (prefix < POLICY_DROP_BASELINE_VERSION) continue;
    const drops = [];
    const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
    for (const m of maskComments(raw).matchAll(DROP_POLICY_RE)) {
      const name = ident(m[1], m[2], m[3]);
      const table = ident(m[7], m[8], m[9]);
      if (name && table) drops.push({ name, table, pos: m.index });
    }
    for (const p of filePolicies) {
      const paired = drops.some((d) => d.name === p.name && d.table === p.table && d.pos < p.pos);
      if (!paired) {
        failures.push(
          `[policy] ${file}:${p.line} create policy "${p.name}" on ${p.table} ` +
            `has no matching "drop policy if exists" earlier in the file`,
        );
      }
    }
  }

  const liveTables = [...tableState.values()].filter((s) => s.live).length;
  return {
    tables: liveTables,
    rlsEnabled: rlsEnabledCount,
    policies: policies.length,
    failures,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const warnOnly = process.argv.includes("--warn-only");
  const { tables, rlsEnabled, policies, failures, warnings } = collectRlsStats();

  console.log(
    `RLS/migration hygiene: tables: ${tables}, rls-enabled: ${rlsEnabled}, ` +
      `policies: ${policies}, failures: ${failures.length}, warnings: ${warnings.length}`,
  );

  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const f of failures) console.log(`  FAIL  ${f}`);

  if (failures.length > 0) {
    if (warnOnly) {
      console.log("--warn-only: ignoring failures (exit 0)");
    } else {
      console.log(`RLS/migration hygiene check failed with ${failures.length} failure(s)`);
      process.exit(1);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
