#!/usr/bin/env node
/**
 * Public API route inventory (ACM-P3-003).
 *
 * The public route surface (no bearer-token auth) was broad but had no single
 * documented inventory: `docs/openapi.yaml` marks public operations with
 * `security: []`, and `docs/API_ENDPOINT_INVENTORY.md` is a stale 2026-06
 * snapshot. This generator derives the inventory from the OpenAPI RouteDefs in
 * `apps/api/src/openapi/spec.ts` (the source `docs/openapi.yaml` is built from,
 * and which `scripts/openapi-audit.js` keeps in sync with the route tree) and
 * writes `docs/PUBLIC_ROUTES.md`.
 *
 * Usage:
 *   node scripts/public-route-inventory.mjs --write   # regenerate the doc
 *   node scripts/public-route-inventory.mjs --check   # fail when it is stale
 *   node scripts/public-route-inventory.mjs           # print to stdout
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC = join(ROOT, "apps", "api", "src", "openapi", "spec.ts");
const DOC = join(ROOT, "docs", "PUBLIC_ROUTES.md");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const write = args.includes("--write");

/**
 * Parse `{ method: "...", path: "...", ... auth: false }` RouteDefs.
 *
 * `method:` starts a RouteDef and the next `method:` starts the following one,
 * so each chunk belongs to exactly one route definition; the first `path:`
 * and an `auth: false` flag inside the chunk identify a public operation.
 */
export function publicRoutes(specSource = readFileSync(SPEC, "utf8")) {
  const routes = [];
  const chunks = specSource.split(/(?=method:\s*")/);
  for (const chunk of chunks) {
    const method = /^method:\s*"([a-z]+)"/.exec(chunk);
    if (!method) continue;
    const path = /path:\s*"([^"]+)"/.exec(chunk);
    if (!path) continue;
    if (!/auth:\s*false/.test(chunk)) continue;
    const summary = /summary:\s*"([^"]*)"/.exec(chunk);
    const tag = /tag:\s*"([^"]*)"/.exec(chunk);
    routes.push({
      method: method[1].toUpperCase(),
      path: path[1],
      summary: summary ? summary[1] : "",
      tag: tag ? tag[1] : "Other",
    });
  }
  // Stable order: tag, then path, then method.
  return routes.sort(
    (a, b) =>
      a.tag.localeCompare(b.tag) ||
      a.path.localeCompare(b.path) ||
      a.method.localeCompare(b.method),
  );
}

function render(routes) {
  const byTag = new Map();
  for (const route of routes) {
    if (!byTag.has(route.tag)) byTag.set(route.tag, []);
    byTag.get(route.tag).push(route);
  }
  const tags = [...byTag.keys()].sort();
  const lines = [
    "# Public API Routes",
    "",
    "> **Generated** by `node scripts/public-route-inventory.mjs --write` from",
    "> the `auth: false` RouteDefs in `apps/api/src/openapi/spec.ts`. Do not edit",
    "> by hand; run the generator (CI runs `--check`) instead.",
    ">",
    "> Public means the OpenAPI operation is documented with `security: []`.",
    "> Signature-verified webhook receivers and CAPTCHA-gated public forms carry",
    "> no bearer-token auth but still verify a credential per request.",
    "",
    `**${routes.length} public operations.**`,
    "",
  ];
  for (const tag of tags) {
    lines.push(`## ${tag}`, "", "| Method | Path | Summary |", "| --- | --- | --- |");
    for (const route of byTag.get(tag)) {
      lines.push(`| ${route.method} | \`${route.path}\` | ${route.summary} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const routes = publicRoutes();
const expected = render(routes);

if (checkOnly) {
  let committed;
  try {
    committed = readFileSync(DOC, "utf8");
  } catch {
    console.error(`error: ${DOC} is missing — run scripts/public-route-inventory.mjs --write`);
    process.exit(1);
  }
  const rowRe = /^\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|\s*$/gm;
  const parseRows = (text) =>
    [...text.matchAll(rowRe)]
      .map((m) => `${m[1]} ${m[2]} ${m[3].trim()}`)
      .sort()
      .join("\n");
  const committedRows = parseRows(committed);
  const expectedRows = parseRows(expected);
  if (committedRows !== expectedRows) {
    console.error("docs/PUBLIC_ROUTES.md is stale — run `node scripts/public-route-inventory.mjs --write`.");
    console.error("expected rows:");
    console.error(expectedRows);
    console.error("committed rows:");
    console.error(committedRows);
    process.exit(1);
  }
  const countMatch = committed.match(/\*\*(\d+) public operations\.\*\*/);
  if (!countMatch || Number(countMatch[1]) !== routes.length) {
    console.error(
      `docs/PUBLIC_ROUTES.md count is stale (expected **${routes.length} public operations.**)`,
    );
    process.exit(1);
  }
  console.log(`PASS: docs/PUBLIC_ROUTES.md lists all ${routes.length} public operations.`);
  process.exit(0);
}

if (write) {
  writeFileSync(DOC, expected, "utf8");
  console.log(`Wrote ${DOC} (${routes.length} public operations).`);
  process.exit(0);
}

process.stdout.write(expected);
