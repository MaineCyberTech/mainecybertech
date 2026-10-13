#!/usr/bin/env node
/**
 * Guard: every referenced permission key must exist in the permission catalog.
 *
 * Why this exists (audit ACM-P3-002 / EVOL-P3-002):
 * `requirePermission(moduleKey, action)` fails closed at runtime — a typo or a
 * removed catalog row denies legitimate users with a 403 that looks like an
 * authz bug. RLS policies have the same problem in the database: a
 * `user_has_permission(..., 'module', 'action')` predicate that references a
 * pair absent from `public.permissions` is permanently false. Nothing checked
 * either surface before this guard, so drift was silent.
 *
 * Checked (all against the catalog extracted from `supabase/migrations`):
 *   1. `requirePermission("m", "a")` literals under apps/api/src (excluding
 *      tests), including multi-line calls.
 *   2. `user_has_permission(..., 'm', 'a')` inside LIVE RLS policies — the
 *      migration history is replayed (create/drop policy, drop table) so only
 *      the effective policy set is checked. Historical policies that a later
 *      migration rewrote are not reported.
 *   3. Module keys passed to the `registerCrud` factory in
 *      apps/api/src/routes/final/crud.ts must exist in the catalog.
 *
 * Usage:
 *   node scripts/check-permission-catalog.mjs [--root <dir>] [--warn]
 *
 * `--root` points at a checkout (used by the negative-fixture self-test);
 * `--warn` reports without failing (local triage).
 */

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const warnOnly = args.includes("--warn");
const rootFlag = args.indexOf("--root");
const ROOT = rootFlag !== -1 ? resolve(args[rootFlag + 1]) : DEFAULT_ROOT;

const MIGRATIONS = join(ROOT, "supabase", "migrations");
const CODE_DIR = join(ROOT, "apps", "api", "src");
const CRUD_FACTORY = join(CODE_DIR, "routes", "final", "crud.ts");

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------

/**
 * Split a SQL file into statements, quote- and comment-aware so `;` inside
 * strings / dollar-quoted blocks does not split a statement. Comments are
 * removed (so commented-out DDL is ignored).
 */
function splitStatements(sql) {
  const statements = [];
  let current = "";
  let i = 0;
  const n = sql.length;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        current += ch;
      }
      i += 1;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
      } else {
        current += ch;
        i += 1;
      }
      continue;
    }
    if (inSingle) {
      current += ch;
      if (ch === "'") {
        if (next === "'") {
          current += next;
          i += 2;
          continue;
        }
        inSingle = false;
      }
      i += 1;
      continue;
    }
    if (inDouble) {
      current += ch;
      if (ch === '"') {
        if (next === '"') {
          current += next;
          i += 2;
          continue;
        }
        inDouble = false;
      }
      i += 1;
      continue;
    }

    if (ch === "-" && next === "-") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === "$") {
      const match = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (ch === ";") {
      statements.push(current);
      current = "";
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  if (current.trim()) statements.push(current);
  return statements;
}

function identifier(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"').toLowerCase();
  }
  const dot = trimmed.lastIndexOf(".");
  return (dot === -1 ? trimmed : trimmed.slice(dot + 1)).toLowerCase();
}

async function migrationFiles() {
  const files = (await readdir(MIGRATIONS)).filter((f) => f.endsWith(".sql"));
  return files.sort((a, b) => {
    const pa = Number.parseInt(a, 10) || 0;
    const pb = Number.parseInt(b, 10) || 0;
    return pa - pb || a.localeCompare(b);
  });
}

/** Catalog pairs `module:action` from every `insert into public.permissions`. */
async function catalogPairs() {
  const pairs = new Set();
  for (const file of await migrationFiles()) {
    const sql = await readFile(join(MIGRATIONS, file), "utf8");
    for (const statement of splitStatements(sql)) {
      if (!/^\s*insert\s+into\s+public\.permissions\b/i.test(statement)) continue;
      // Every tuple in the insert body is a permission row; the first two
      // quoted values are module_key / action_key.
      for (const m of statement.matchAll(/\(\s*'([^']+)'\s*,\s*'([^']+)'/g)) {
        pairs.add(`${m[1]}:${m[2]}`);
      }
    }
  }
  return pairs;
}

/**
 * Replay create/drop policy + drop table to find the LIVE policies and their
 * `user_has_permission(..., 'm', 'a')` references.
 */
async function livePolicyReferences() {
  const policies = new Map(); // "table.policy" -> { file, body }
  const liveTables = new Set();

  for (const file of await migrationFiles()) {
    const sql = await readFile(join(MIGRATIONS, file), "utf8");
    for (const statement of splitStatements(sql)) {
      const text = statement.trim();

      const dropTable = /^drop\s+table\s+(?:if\s+exists\s+)?(.+?)(?:\s+cascade)?\s*$/is.exec(text);
      if (dropTable) {
        for (const raw of dropTable[1].split(",")) {
          const table = identifier(raw);
          liveTables.delete(table);
          for (const key of [...policies.keys()]) {
            if (key.startsWith(`${table}.`)) policies.delete(key);
          }
        }
        continue;
      }
      const createTable = /^create\s+table\s+(?:if\s+not\s+exists\s+)?([^\s(]+)/is.exec(text);
      if (createTable) {
        liveTables.add(identifier(createTable[1]));
        continue;
      }
      const dropPolicy =
        /^drop\s+policy\s+(?:if\s+exists\s+)?("(?:[^"]|"")*"|[A-Za-z_][\w$]*)\s+on\s+([^\s;]+)/is.exec(
          text,
        );
      if (dropPolicy) {
        const name = identifier(dropPolicy[1]);
        const table = identifier(dropPolicy[2]);
        policies.delete(`${table}.${name}`);
        continue;
      }
      const createPolicy =
        /^create\s+policy\s+(?:if\s+not\s+exists\s+)?("(?:[^"]|"")*"|[A-Za-z_][\w$]*)\s+on\s+([^\s(]+)/is.exec(
          text,
        );
      if (createPolicy) {
        const name = identifier(createPolicy[1]);
        const table = identifier(createPolicy[2]);
        policies.set(`${table}.${name}`, { file, body: text });
      }
    }
  }

  const refs = [];
  for (const [key, { file, body }] of policies) {
    const [table] = key.split(".");
    if (!liveTables.has(table)) continue; // policy on a dropped table
    for (const m of body.matchAll(
      /user_has_permission\s*\(\s*[^,]*?,\s*'([^']+)'\s*,\s*'([^']+)'/gi,
    )) {
      refs.push({ pair: `${m[1]}:${m[2]}`, policy: key, file });
    }
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Code references
// ---------------------------------------------------------------------------

async function tsFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      out.push(...(await tsFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

async function codeReferences() {
  const refs = [];
  const missingModules = [];

  if (existsSync(CODE_DIR)) {
    for (const file of await tsFiles(CODE_DIR)) {
      const src = await readFile(file, "utf8");
      for (const m of src.matchAll(
        /requirePermission\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/gs,
      )) {
        refs.push({ pair: `${m[1]}:${m[2]}`, file: relative(ROOT, file) });
      }
    }
  }

  if (existsSync(CRUD_FACTORY)) {
    const src = await readFile(CRUD_FACTORY, "utf8");
    for (const m of src.matchAll(/module:\s*"([^"]+)"/g)) {
      missingModules.push({ module: m[1], file: relative(ROOT, CRUD_FACTORY) });
    }
  }

  return { refs, missingModules };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

let catalog;
let liveRefs;
let code;
try {
  catalog = await catalogPairs();
  liveRefs = await livePolicyReferences();
  code = await codeReferences();
} catch (error) {
  console.error(`error: permission-catalog scan failed: ${error.message}`);
  process.exit(2);
}

const catalogModules = new Set([...catalog].map((pair) => pair.split(":")[0]));
const violations = [];

for (const ref of code.refs) {
  if (!catalog.has(ref.pair)) {
    violations.push(`[code] ${ref.file} references ${ref.pair}`);
  }
}
for (const ref of liveRefs) {
  if (!catalog.has(ref.pair)) {
    violations.push(`[rls] ${ref.policy} references ${ref.pair} (${ref.file})`);
  }
}
for (const mod of code.missingModules) {
  if (!catalogModules.has(mod.module)) {
    violations.push(`[crud] ${mod.file} registers unknown module "${mod.module}"`);
  }
}

const refCount = code.refs.length + liveRefs.length + code.missingModules.length;
if (violations.length > 0) {
  console.error(
    `Permission catalog drift (${violations.length}): referenced keys absent from ` +
      `${catalog.size} catalog keys in supabase/migrations:`,
  );
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error(
    "\nFix the reference or add the permission row in a new migration " +
      "(module_key, action_key). See docs/access-control-matrix.md.",
  );
  if (!warnOnly) process.exit(1);
  console.error("(--warn: not failing the build)");
  process.exit(0);
}

console.log(
  `PASS: ${code.refs.length} requirePermission + ${liveRefs.length} live-policy ` +
    `references resolve against ${catalog.size} catalog keys ` +
    `(${code.missingModules.length} CRUD module keys checked).`,
);
