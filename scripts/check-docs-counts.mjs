#!/usr/bin/env node
/**
 * Docs count guard.
 *
 * Fails (exit 1) when numbers the docs state about the repo drift from the
 * repo itself. Prints every mismatch it finds; prints "docs counts OK" on a
 * clean run. Dependency-free — plain Node, no package install required.
 *
 * Checked:
 *   - AGENTS.md "Web components | N" vs apps/web/components/**\/*.tsx
 *   - AGENTS.md "**N tests, all passing. M suites.**" vs its per-package rows
 *   - README.md "All unit tests (N)" and "**N tests**" vs the AGENTS total
 *   - README.md per-package (web/API/SDK/worker) counts vs AGENTS.md rows
 *   - docs/INDEX.md "(N paths)" vs "  \"/" lines in docs/openapi.yaml
 *   - AGENTS.md "Web pages | N | Admin/Portal/Public/forbidden" vs
 *     apps/web/app/**\/*.tsx page files
 *   - AGENTS.md / README.md E2E spec count vs apps/web/e2e/**\/*.spec.ts
 *   - AGENTS.md API route files (top-level + recursive), SDK modules, worker
 *     task files, seed files, GitHub Actions workflows, AI prompt files and
 *     build/dev/utility scripts vs the filesystem
 *   - AGENTS.md SQL migrations total and "(latest: N)" vs supabase/migrations
 *   - docs/WEB_UI_CONVENTIONS.md admin/portal nav entry counts vs the
 *     `key:` occurrences in the nav catalogs
 *   - AGENTS.md (and review.md, if present) "N policies" vs
 *     collectRlsStats() from scripts/verify-rls.mjs
 *
 * Usage: node scripts/check-docs-counts.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectRlsStats } from "./verify-rls.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

function tryRead(relPath) {
  try {
    return read(relPath);
  } catch {
    return null;
  }
}

function num(value) {
  return Number(String(value).replace(/,/g, ""));
}

const mismatches = [];

function check(label, expected, actual) {
  if (expected !== actual) {
    mismatches.push(`${label}: docs say ${expected}, repo has ${actual}`);
  }
}

function parse(label, text, pattern, group = 1) {
  const match = text.match(pattern);
  if (!match) {
    mismatches.push(`${label}: expected value not found (pattern ${pattern})`);
    return null;
  }
  return num(match[group]);
}

function walkFiles(dir, predicate) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full, predicate));
    else if (entry.isFile() && predicate(full, entry.name)) files.push(full);
  }
  return files;
}

function countFiles(relDir, predicate = () => true) {
  return walkFiles(join(ROOT, relDir), predicate).length;
}

/**
 * Count `.tsx` files under apps/web/components. A filesystem walk is used so
 * the guard reflects the working tree (including new files not yet committed),
 * which is what the docs are being checked against.
 */
function countComponentTsx() {
  return countFiles("apps/web/components", (full, name) => name.endsWith(".tsx"));
}

const agents = read("AGENTS.md");
const readme = read("README.md");

// --- AGENTS.md "Web components | N" --------------------------------------
const actualComponents = countComponentTsx();
const declaredComponents = parse(
  "AGENTS.md Web components",
  agents,
  /^\|\s*Web components\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredComponents !== null) {
  check(
    "AGENTS.md Web components (apps/web/components/**/*.tsx)",
    declaredComponents,
    actualComponents,
  );
}

// --- AGENTS.md test totals vs per-package rows ---------------------------
const PACKAGES = { API: "api", Web: "web", SDK: "sdk", Worker: "worker" };
const rows = {};
for (const match of agents.matchAll(
  /^\|\s*(API|Web|SDK|Worker)\s*\|\s*\**\s*([\d,]+)\s*\**\s*\|\s*\**\s*([\d,]+)\s*\**\s*\|/gm,
)) {
  rows[PACKAGES[match[1]]] = { tests: num(match[2]), suites: num(match[3]) };
}
for (const [display, key] of Object.entries(PACKAGES)) {
  if (!rows[key]) mismatches.push(`AGENTS.md: per-package row "${display}" not found`);
}
const rowTests = Object.values(rows).reduce((sum, row) => sum + row.tests, 0);
const rowSuites = Object.values(rows).reduce((sum, row) => sum + row.suites, 0);

const agentsTotal = parse(
  "AGENTS.md test total",
  agents,
  /\*\*\s*([\d,]+)\s*tests?,\s*all passing\.\s*([\d,]+)\s*suites?\.\s*\*\*/,
);
const agentsSuites = parse(
  "AGENTS.md suite total",
  agents,
  /\*\*\s*[\d,]+\s*tests?,\s*all passing\.\s*([\d,]+)\s*suites?\.\s*\*\*/,
);
if (agentsTotal !== null && Object.keys(rows).length === 4) {
  check("AGENTS.md test total vs sum of per-package rows", agentsTotal, rowTests);
}
if (agentsSuites !== null && Object.keys(rows).length === 4) {
  check("AGENTS.md suite total vs sum of per-package rows", agentsSuites, rowSuites);
}

// --- README.md totals vs AGENTS.md total ---------------------------------
const readmeTotal = parse(
  "README.md All unit tests",
  readme,
  /\*{0,2}All unit tests\*{0,2}\s*\(([\d,]+)\)/,
);
if (readmeTotal !== null && agentsTotal !== null) {
  check("README.md All unit tests vs AGENTS.md total", agentsTotal, readmeTotal);
}
const readmeBoldTotal = parse("README.md bold test total", readme, /\*\*([\d,]+) tests\*\*/);
if (readmeBoldTotal !== null && agentsTotal !== null) {
  check("README.md **N tests** vs AGENTS.md total", agentsTotal, readmeBoldTotal);
}

// --- README.md per-package counts vs AGENTS.md rows ----------------------
const readmePackages = [
  ["web", "README.md web tests", /web app with complete test coverage\s*\(([\d,]+) tests\)/],
  ["api", "README.md API tests", /API \/ backend[^\n]*\(([\d,]+) tests\)/],
  ["sdk", "README.md SDK tests", /SDK package with retry logic\s*\(([\d,]+) tests\)/],
  ["worker", "README.md worker tests", /worker framework[^\n]*\(([\d,]+) tests\)/],
];
for (const [key, label, pattern] of readmePackages) {
  const value = parse(label, readme, pattern);
  if (value !== null && rows[key]) {
    check(`${label} vs AGENTS.md ${key} row`, rows[key].tests, value);
  }
}

// --- docs/INDEX.md path count vs docs/openapi.yaml -----------------------
const indexPathCount = parse(
  "docs/INDEX.md openapi paths",
  read("docs/INDEX.md"),
  /\(([\d,]+) paths\)/,
);
if (indexPathCount !== null) {
  const yamlPaths = (read("docs/openapi.yaml").match(/^ {2}"\//gm) ?? []).length;
  check("docs/INDEX.md openapi paths vs docs/openapi.yaml", indexPathCount, yamlPaths);
}

// --- AGENTS.md "Web pages" row vs app/**/page.tsx ------------------------
const APP_DIR = join(ROOT, "apps/web/app");
const pageFiles = walkFiles(APP_DIR, (full, name) => name === "page.tsx");
const pageGroups = { admin: 0, portal: 0, public: 0, forbidden: 0, other: 0 };
for (const file of pageFiles) {
  const [top] = relative(APP_DIR, file).split(/[\\/]/);
  if (top === "(admin)") pageGroups.admin += 1;
  else if (top === "(portal)") pageGroups.portal += 1;
  else if (top === "(public)") pageGroups.public += 1;
  else if (top === "forbidden") pageGroups.forbidden += 1;
  else pageGroups.other += 1;
}
const webPagesRow = agents.match(
  /^\|\s*Web pages\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|\s*Admin\s*(\d[\d,]*),\s*Portal\s*(\d[\d,]*),\s*Public\s*(\d[\d,]*),\s*`?forbidden`?\s*(\d[\d,]*)/m,
);
if (!webPagesRow) {
  mismatches.push("AGENTS.md Web pages: expected row not found");
} else {
  check(
    "AGENTS.md Web pages total vs apps/web/app/**/page.tsx",
    num(webPagesRow[1]),
    pageFiles.length,
  );
  check("AGENTS.md Web pages admin vs apps/web/app/(admin)", num(webPagesRow[2]), pageGroups.admin);
  check(
    "AGENTS.md Web pages portal vs apps/web/app/(portal)",
    num(webPagesRow[3]),
    pageGroups.portal,
  );
  check(
    "AGENTS.md Web pages public vs apps/web/app/(public)",
    num(webPagesRow[4]),
    pageGroups.public,
  );
  check(
    "AGENTS.md Web pages forbidden vs apps/web/app/forbidden",
    num(webPagesRow[5]),
    pageGroups.forbidden,
  );
  if (pageGroups.other > 0) {
    mismatches.push(
      `AGENTS.md Web pages: ${pageGroups.other} page(s) outside (admin)/(portal)/(public)/forbidden`,
    );
  }
}

// --- AGENTS.md "GitHub Actions workflows" row ----------------------------
const workflowCount = readdirSync(join(ROOT, ".github/workflows"), { withFileTypes: true }).filter(
  (entry) => entry.isFile() && entry.name.endsWith(".yml"),
).length;
const declaredWorkflows = parse(
  "AGENTS.md GitHub Actions workflows",
  agents,
  /^\|\s*GitHub Actions workflows\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredWorkflows !== null) {
  check(
    "AGENTS.md GitHub Actions workflows vs .github/workflows/*.yml",
    declaredWorkflows,
    workflowCount,
  );
}

// --- AGENTS.md "Build/dev/utility scripts" row ---------------------------
const scriptCount = countFiles("scripts");
const declaredScripts = parse(
  "AGENTS.md Build/dev/utility scripts",
  agents,
  /^\|\s*Build\/dev\/utility scripts\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredScripts !== null) {
  check(
    "AGENTS.md Build/dev/utility scripts vs scripts/ (recursive)",
    declaredScripts,
    scriptCount,
  );
}

// --- AGENTS.md SQL migrations total + latest -----------------------------
const migrationDir = join(ROOT, "supabase/migrations");
const migrationFiles = readdirSync(migrationDir).filter((name) => name.endsWith(".sql"));
const declaredMigrationCount = parse(
  "AGENTS.md SQL migrations total",
  agents,
  /^\|\s*SQL migrations\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredMigrationCount !== null) {
  check(
    "AGENTS.md SQL migrations total vs supabase/migrations/*.sql",
    declaredMigrationCount,
    migrationFiles.length,
  );
}
const migrations = migrationFiles
  .map((name) => ({ name, version: Number((name.match(/^(\d+)/) ?? [])[1]) }))
  .filter((entry) => Number.isFinite(entry.version))
  .sort((a, b) => b.version - a.version);
const declaredLatest = parse("AGENTS.md latest migration", agents, /\(latest:\s*([\d]+)/i);
if (declaredLatest !== null && migrations.length > 0) {
  check(
    `AGENTS.md latest migration vs newest file (${migrations[0].name})`,
    declaredLatest,
    migrations[0].version,
  );
}

// --- README.md E2E spec count --------------------------------------------
const e2eSpecCount = countFiles("apps/web/e2e", (full, name) => name.endsWith(".spec.ts"));
const readmeSpecs = parse("README.md E2E spec files", readme, /\(([\d,]+) spec files\)/);
if (readmeSpecs !== null) {
  check("README.md E2E spec files vs apps/web/e2e/**/*.spec.ts", readmeSpecs, e2eSpecCount);
}

// --- AGENTS.md "API route files" row (top-level + recursive) -------------
const routesDir = join(ROOT, "apps/api/src/routes");
const routesTop = readdirSync(routesDir, { withFileTypes: true }).filter(
  (entry) => entry.isFile() && entry.name.endsWith(".ts"),
).length;
const routesAll = countFiles("apps/api/src/routes", (full, name) => name.endsWith(".ts"));
const routesRow = agents.match(
  /^\|\s*API route files\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|[^|]*\((\d[\d,]*)\s+incl\./m,
);
if (!routesRow) {
  mismatches.push("AGENTS.md API route files: expected row not found");
} else {
  check("AGENTS.md API route files vs apps/api/src/routes/*.ts", num(routesRow[1]), routesTop);
  check("AGENTS.md API route files (incl. final/ + store/)", num(routesRow[2]), routesAll);
}

// --- AGENTS.md "API SDK modules" row -------------------------------------
const sdkDir = join(ROOT, "packages/sdk/src");
const sdkModules = readdirSync(sdkDir, { withFileTypes: true }).filter(
  (entry) =>
    entry.isFile() &&
    entry.name.endsWith(".ts") &&
    entry.name !== "index.ts" &&
    entry.name !== "database.types.ts",
).length;
const declaredSdkModules = parse(
  "AGENTS.md API SDK modules",
  agents,
  /^\|\s*API SDK modules\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredSdkModules !== null) {
  check("AGENTS.md API SDK modules vs packages/sdk/src/*.ts", declaredSdkModules, sdkModules);
}

// --- AGENTS.md "Seed files" row ------------------------------------------
const seedCount = readdirSync(join(ROOT, "supabase/seeds")).filter((name) =>
  name.endsWith(".sql"),
).length;
const declaredSeeds = parse(
  "AGENTS.md Seed files",
  agents,
  /^\|\s*Seed files\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredSeeds !== null) {
  check("AGENTS.md Seed files vs supabase/seeds/*.sql", declaredSeeds, seedCount);
}

// --- AGENTS.md "Worker task files" row -----------------------------------
const workerTaskDir = join(ROOT, "apps/worker/src/tasks");
const workerTasks = readdirSync(workerTaskDir, { withFileTypes: true }).filter(
  (entry) => entry.isFile() && entry.name.endsWith(".ts") && entry.name !== "index.ts",
).length;
const declaredWorkerTasks = parse(
  "AGENTS.md Worker task files",
  agents,
  /^\|\s*Worker task files\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredWorkerTasks !== null) {
  check(
    "AGENTS.md Worker task files vs apps/worker/src/tasks/*.ts",
    declaredWorkerTasks,
    workerTasks,
  );
}

// --- AGENTS.md "AI prompt files" row -------------------------------------
const promptCount = countFiles("prompts");
const declaredPrompts = parse(
  "AGENTS.md AI prompt files",
  agents,
  /^\|\s*AI prompt files\s*\|\s*\**\s*(\d[\d,]*)\s*\**\s*\|/m,
);
if (declaredPrompts !== null) {
  check("AGENTS.md AI prompt files vs prompts/ (recursive)", declaredPrompts, promptCount);
}

// --- docs/WEB_UI_CONVENTIONS.md nav counts vs the nav catalogs -----------
const conventions = read("docs/WEB_UI_CONVENTIONS.md");
const navEntries = (relPath) => (read(relPath).match(/key:\s*"/g) ?? []).length;
const declaredAdminNav = parse(
  "docs/WEB_UI_CONVENTIONS.md admin nav entries",
  conventions,
  /admin-nav\.ts[`\s]*\((\d[\d,]*)\s+(?:entries|sections)/,
);
if (declaredAdminNav !== null) {
  check(
    "docs/WEB_UI_CONVENTIONS.md admin nav entries vs admin-nav.ts key: occurrences",
    declaredAdminNav,
    navEntries("apps/web/lib/navigation/admin-nav.ts"),
  );
}
const declaredPortalNav = parse(
  "docs/WEB_UI_CONVENTIONS.md portal nav entries",
  conventions,
  /portal-nav\.ts[`\s]*\((\d[\d,]*)\s+(?:entries|sections)/,
);
if (declaredPortalNav !== null) {
  check(
    "docs/WEB_UI_CONVENTIONS.md portal nav entries vs portal-nav.ts key: occurrences",
    declaredPortalNav,
    navEntries("apps/web/lib/navigation/portal-nav.ts"),
  );
}

// --- AGENTS.md / review.md "N policies" vs verify-rls --------------------
const POLICY_COUNT_RE = /all RLS-enabled,\s*([\d,]+)\s+policies/i;
const rlsStats = collectRlsStats();
const agentsPolicies = parse("AGENTS.md RLS policies", agents, POLICY_COUNT_RE);
if (agentsPolicies !== null) {
  check("AGENTS.md RLS policies vs scripts/verify-rls.mjs", agentsPolicies, rlsStats.policies);
}
const review = tryRead("review.md");
if (review !== null) {
  const reviewPolicies = parse("review.md RLS policies", review, POLICY_COUNT_RE);
  if (reviewPolicies !== null) {
    check("review.md RLS policies vs scripts/verify-rls.mjs", reviewPolicies, rlsStats.policies);
  }
}

if (mismatches.length > 0) {
  console.error(`docs count drift detected (${mismatches.length}):`);
  for (const mismatch of mismatches) console.error(`  - ${mismatch}`);
  process.exit(1);
}
console.log("docs counts OK");
