/**
 * OpenAPI coverage audit.
 *
 * Reconstructs the live Express route tree from the router source files and
 * compares it to the RouteDef list in apps/api/src/openapi/spec.ts (the source
 * of docs/openapi.yaml). Reports:
 *   - MISSING: routes present in code but absent from the spec (fails by default)
 *   - EXTRA:   spec entries with no statically-resolvable code route (warning —
 *              dynamic registrations like the `registerCrud` factory cannot be
 *              resolved statically)
 *
 * Usage:
 *   node scripts/openapi-audit.js            # exit 1 when MISSING > 0
 *   node scripts/openapi-audit.js --report   # always exit 0
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROUTES_DIR = path.join(ROOT, "apps/api/src/routes");
const SPEC = path.join(ROOT, "apps/api/src/openapi/spec.ts");
const APP_TS = path.join(ROOT, "apps/api/src/app.ts");

const METHODS = ["get", "post", "put", "patch", "delete"];

// --- app.ts mounts: import xRouter from "./routes/x" + app.use("/prefix", xRouter)
const appSrc = fs.readFileSync(APP_TS, "utf8");
const varToBase = {};
const importRe = /import\s+(\w+Router)\s+from\s+["']\.\/routes\/([\w-]+)["']/g;
let m;
while ((m = importRe.exec(appSrc))) varToBase[m[1]] = m[2];

const prefixByBase = {};
const useRe = /app\.use\(\s*"([^"]+)"\s*,\s*(\w+Router)\s*\)/g;
while ((m = useRe.exec(appSrc))) {
  const base = varToBase[m[2]];
  if (base) prefixByBase[base] = m[1];
}

// --- live routes
const liveRoutes = new Set();
const routeLiteralRe = /router\.(get|post|put|patch|delete)\(\s*(["'`])([^"'`]*)\2/g;

function collectFile(file, prefix) {
  const src = fs.readFileSync(file, "utf8");
  let rm;
  routeLiteralRe.lastIndex = 0;
  while ((rm = routeLiteralRe.exec(src))) {
    const method = rm[1].toUpperCase();
    const p = rm[3];
    if (p.includes("${")) continue; // dynamic template literal — not statically resolvable
    const full = (prefix + p).replace(/\/+/g, "/");
    liveRoutes.add(`${method} ${stripApiPrefix(full)}`);
  }
}

function isRouteSource(name) {
  return name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "index.ts";
}

for (const entry of fs.readdirSync(ROUTES_DIR)) {
  if (isRouteSource(entry)) {
    const base = entry.replace(/\.ts$/, "");
    collectFile(path.join(ROUTES_DIR, entry), prefixByBase[base] ?? "");
  }
}
for (const sub of ["store", "final"]) {
  const dir = path.join(ROUTES_DIR, sub);
  if (!fs.existsSync(dir)) continue;
  const prefix = prefixByBase[sub] ?? `/api/v1/${sub}`;
  for (const entry of fs.readdirSync(dir)) {
    if (isRouteSource(entry)) collectFile(path.join(dir, entry), prefix);
  }
}

// --- spec routes (method-first entries, with a path-first fallback)
const specSrc = fs.readFileSync(SPEC, "utf8");
const specRoutes = new Set();
const methodFirstRe =
  /method:\s*["'](get|post|put|patch|delete)["']\s*,\s*path:\s*["'`]([^"'`]+)["'`]/g;
while ((m = methodFirstRe.exec(specSrc))) {
  specRoutes.add(`${m[1].toUpperCase()} ${normalize(m[2])}`);
}
const pathFirstRe =
  /path:\s*["'`]([^"'`]+)["'`][^{}]{0,120}?method:\s*["'](get|post|put|patch|delete)["']/g;
while ((m = pathFirstRe.exec(specSrc))) {
  specRoutes.add(`${m[2].toUpperCase()} ${normalize(m[1])}`);
}

// --- compare (params compared structurally: :id / {id} / {factorId} all equal)
function stripApiPrefix(p) {
  return p.startsWith("/api/v1/") ? p.slice("/api/v1".length) : p;
}
function normalize(p) {
  const cleaned = p
    .replace(/\/+/g, "/")
    .replace(/\{[^}]+\}/g, ":x")
    .replace(/:[A-Za-z][A-Za-z0-9_]*/g, ":x");
  return cleaned.length > 1 && cleaned.endsWith("/") ? cleaned.slice(0, -1) : cleaned;
}

const liveNormalized = new Set(
  [...liveRoutes].map((r) => `${r.split(" ")[0]} ${normalize(r.split(" ")[1])}`),
);
const specNormalized = new Set(
  [...specRoutes].map((r) => `${r.split(" ")[0]} ${normalize(r.split(" ")[1])}`),
);

const missing = [...liveNormalized].filter((r) => !specNormalized.has(r)).sort();
const extra = [...specNormalized].filter((r) => !liveNormalized.has(r)).sort();

console.log(`Live routes parsed:  ${liveNormalized.size}`);
console.log(`Spec route entries:  ${specNormalized.size}`);
console.log(`MISSING from spec (${missing.length}):`);
for (const r of missing) console.log("  " + r);
console.log(`Dynamic/unresolved spec entries (${extra.length}) — not statically verifiable:`);
for (const r of extra.slice(0, 10)) console.log("  " + r);
if (extra.length > 10) console.log(`  … and ${extra.length - 10} more`);

if (missing.length > 0 && !process.argv.includes("--report")) {
  console.error(
    `\nOpenAPI coverage failed: ${missing.length} live route(s) missing from the spec.`,
  );
  process.exit(1);
}
