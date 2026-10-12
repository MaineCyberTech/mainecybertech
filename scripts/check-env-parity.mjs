#!/usr/bin/env node
/**
 * Environment parity guard (SECRET-P3-005).
 *
 * The runtime env schemas (Zod), the `.env.example` templates and
 * `docs/ENVIRONMENT_VARIABLES.md` drifted apart silently: keys could be added
 * to a schema without a template row, or documented without a schema entry.
 * This guard enforces, per app:
 *
 *   1. every schema key appears in the matching `.env.example`
 *      (commented placeholder counts — the example must at least name it);
 *   2. every `.env.example` key is either in the schema or in the explicit
 *      `EXTERNAL_KEYS` allowlist below (keys consumed outside the Zod schema,
 *      e.g. by Caddy or read directly from `process.env`);
 *   3. every schema/example key is documented in `docs/ENVIRONMENT_VARIABLES.md`.
 *
 * Dependency-free (plain Node). `--self-test` runs the checker against inline
 * fixtures (including negative ones) so a broken detector cannot pass silently.
 *
 * Usage:
 *   node scripts/check-env-parity.mjs
 *   node scripts/check-env-parity.mjs --self-test
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_PATH = "docs/ENVIRONMENT_VARIABLES.md";
/**
 * EVOL-P3-005: the API/worker env schemas compose shared Zod shapes
 * (`...supabaseEnvShape`, `...sentryEnvShape`, …) from `@mct/config/env`, so
 * the parser must resolve those spreads or every shared key looks missing.
 */
const SHARED_ENV_SCHEMA = "packages/config/src/env.ts";

/**
 * Keys intentionally present in an `.env.example` but outside that app's Zod
 * schema. Keep this list small and justified; every entry must still be
 * documented in `docs/ENVIRONMENT_VARIABLES.md`.
 */
export const EXTERNAL_KEYS = {
  api: {
    APP_DOMAIN: "consumed by the Caddy reverse proxy and deploy .env",
    API_DOMAIN: "consumed by the Caddy reverse proxy and deploy .env",
  },
  worker: {
    WORKER_SHUTDOWN_TIMEOUT_MS: "read directly by src/shutdown.ts (graceful-drain budget)",
  },
  web: {
    SENTRY_ORG: "Sentry source-map build tooling (not runtime)",
    SENTRY_PROJECT: "Sentry source-map build tooling (not runtime)",
    SENTRY_TRACES_SAMPLE_RATE: "read by the server Sentry configs from process.env",
    SENTRY_RELEASE: "read by the server Sentry configs from process.env",
    NEXT_PUBLIC_TEST_ACCOUNTS_ENABLED: "read directly by lib/test-accounts.ts",
  },
};

export const APPS = [
  { name: "api", example: "apps/api/.env.example", schema: "apps/api/src/config/env.ts" },
  { name: "worker", example: "apps/worker/.env.example", schema: "apps/worker/src/env.ts" },
  { name: "web", example: "apps/web/.env.example", schema: "apps/web/lib/env.ts" },
];

/** Keys assigned in an env template, including commented-out placeholders. */
export function exampleKeys(text) {
  const keys = new Set();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)\s*=/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

/** Balanced `{ ... }` block starting at the first `{` at/after `from`. */
function objectBlock(text, from) {
  let depth = 0;
  let i = text.indexOf("{", from);
  const begin = i;
  for (; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  return text.slice(begin + 1, i);
}

/**
 * `export const NAME = { ... }` / `= z.object({ ... })` shapes in the shared
 * env module, with nested spreads resolved (declaration order matters).
 */
export function sharedShapeKeys(text) {
  const shapes = new Map();
  const declaration = /export const ([A-Za-z0-9_]+)\s*=\s*(?:z\.object\()?\{/g;
  let match;
  while ((match = declaration.exec(text)) !== null) {
    const block = objectBlock(text, match.index + match[0].length - 1);
    const keys = new Set();
    for (const spread of block.matchAll(/^\s{2,}\.\.\.([A-Za-z0-9_]+)\s*,/gm)) {
      const nested = shapes.get(spread[1]);
      if (nested) for (const key of nested) keys.add(key);
    }
    for (const key of block.matchAll(/^\s{2,}([A-Z][A-Z0-9_]*)\s*:/gm)) {
      keys.add(key[1]);
    }
    shapes.set(match[1], keys);
  }
  return shapes;
}

/** Keys contributed by a schema block, following `...shape` spreads. */
function blockKeys(block, shared) {
  const keys = new Set();
  for (const spread of block.matchAll(/^\s{2,}\.\.\.([A-Za-z0-9_]+)\s*,/gm)) {
    const shape = shared.get(spread[1]);
    if (shape) for (const key of shape) keys.add(key);
  }
  for (const key of block.matchAll(/^\s{2,}([A-Z][A-Z0-9_]*)\s*:/gm)) {
    keys.add(key[1]);
  }
  return keys;
}

/** Top-level keys of the first `z.object({ ... })` block in a schema file. */
export function schemaKeys(text, sharedText = "") {
  const start = text.indexOf(".object({");
  if (start === -1) {
    throw new Error("no z.object({ ... }) block found");
  }
  const shared = sharedShapeKeys(sharedText);
  return blockKeys(objectBlock(text, start), shared);
}

/** Environment-variable names mentioned anywhere in the docs (backticked). */
export function documentedKeys(text) {
  const keys = new Set();
  for (const match of text.matchAll(/`([A-Z][A-Z0-9_]*)`/g)) keys.add(match[1]);
  return keys;
}

/**
 * Pure checker for one app. Returns a sorted list of human-readable problems.
 */
export function checkParity({ name, example, schema, docs, external = {}, shared = "" }) {
  const problems = [];
  const exampleSet = exampleKeys(example);
  const schemaSet = schemaKeys(schema, shared);
  const docsSet = documentedKeys(docs);

  for (const key of [...schemaSet].sort()) {
    if (!exampleSet.has(key)) {
      problems.push(`${name}: schema key ${key} is missing from the .env.example`);
    }
  }
  for (const key of [...exampleSet].sort()) {
    if (!schemaSet.has(key) && !Object.prototype.hasOwnProperty.call(external, key)) {
      problems.push(
        `${name}: .env.example key ${key} is not in the schema or the EXTERNAL_KEYS allowlist`,
      );
    }
  }
  for (const key of [...new Set([...schemaSet, ...exampleSet])].sort()) {
    if (!docsSet.has(key)) {
      problems.push(`${name}: ${key} is not documented in ${DOCS_PATH}`);
    }
  }
  return problems;
}

function selfTest() {
  const failures = [];
  const expect = (label, condition) => {
    if (!condition) failures.push(`self-test: ${label}`);
  };

  const docs = "`KEEP` `ALLOWED` `SCHEMA_ONLY` `EXAMPLE_ONLY` `FROM_SHARED`";
  const schemaFixture = ".object({\n  KEEP: z.string(),\n  SCHEMA_ONLY: z.string(),\n})";
  const sharedFixture = "export const sharedShape = {\n  FROM_SHARED: z.string(),\n} as const;";
  const clean = checkParity({
    name: "fixture",
    example: "KEEP=1\nALLOWED=2\n# SCHEMA_ONLY=\n",
    schema: schemaFixture,
    docs,
    external: { ALLOWED: "allowed for the fixture" },
  });
  expect("clean fixture passes", clean.length === 0);

  const spread = checkParity({
    name: "fixture",
    example: "KEEP=1\nFROM_SHARED=2\n",
    schema: ".object({\n  KEEP: z.string(),\n  ...sharedShape,\n})",
    docs,
    external: {},
    shared: sharedFixture,
  });
  expect("shared-shape spreads resolve", spread.length === 0);

  const missingFromExample = checkParity({
    name: "fixture",
    example: "KEEP=1\n",
    schema: schemaFixture,
    docs,
    external: {},
  });
  expect(
    "schema key missing from the example is reported",
    missingFromExample.some((p) => p.includes("SCHEMA_ONLY") && p.includes(".env.example")),
  );

  const unknownExampleKey = checkParity({
    name: "fixture",
    example: "KEEP=1\nEXAMPLE_ONLY=2\n",
    schema: ".object({\n  KEEP: z.string(),\n})",
    docs,
    external: {},
  });
  expect(
    "example key outside schema+allowlist is reported",
    unknownExampleKey.some((p) => p.includes("EXAMPLE_ONLY") && p.includes("EXTERNAL_KEYS")),
  );

  const undocumented = checkParity({
    name: "fixture",
    example: "KEEP=1\n",
    schema: ".object({\n  KEEP: z.string(),\n})",
    docs: "nothing here",
    external: {},
  });
  expect(
    "undocumented key is reported",
    undocumented.some((p) => p.includes("KEEP") && p.includes("docs/ENVIRONMENT_VARIABLES.md")),
  );

  if (failures.length) {
    console.error(failures.join("\n"));
    console.error("env-parity guard self-test FAILED");
    process.exit(1);
  }
  console.log("env-parity guard self-test OK");
}

const mode = process.argv[2];
if (mode === "--self-test") {
  selfTest();
} else {
  const docs = readFileSync(join(ROOT, DOCS_PATH), "utf8");
  const shared = readFileSync(join(ROOT, SHARED_ENV_SCHEMA), "utf8");
  const problems = [];
  for (const app of APPS) {
    problems.push(
      ...checkParity({
        name: app.name,
        example: readFileSync(join(ROOT, app.example), "utf8"),
        schema: readFileSync(join(ROOT, app.schema), "utf8"),
        docs,
        external: EXTERNAL_KEYS[app.name] ?? {},
        shared,
      }),
    );
  }
  if (problems.length) {
    console.error(`environment parity drift detected (${problems.length}):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("environment parity OK");
}
