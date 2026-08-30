/**
 * OpenAPI coverage audit (P2-8).
 *
 * Reconstructs the live route tree from router source files and compares it
 * to the OpenAPI path definitions declared in apps/api/src/openapi/spec.ts.
 * Prints routes present in code but MISSING from the spec so the spec can be
 * completed. This is a dev/CI helper, not a runtime dependency.
 */
const fs = require("fs");
const path = require("path");

const ROUTES_DIR = path.resolve(__dirname, "..", "apps/api/src/routes");
const SPEC = path.resolve(__dirname, "..", "apps/api/src/openapi/spec.ts");

// app.use("/prefix", xxxRouter) and app.use(xxxRouter) in app.ts -> mountpoints
const APP_TS = path.resolve(__dirname, "..", "apps/api/src/app.ts");
const appSrc = fs.readFileSync(APP_TS, "utf8");

// router imports in app.ts: import xRouter from "./routes/x"
const mounts = {}; // routerVar -> prefix
const importRe = /import\s+(\w+Router)\s+from\s+["']\.\/routes\/([\w-]+)["']/g;
let m;
while ((m = importRe.exec(appSrc))) {
  mounts[m[1]] = m[2];
}
// app.use("/prefix", xRouter) or app.use(xRouter)
const useRe = /app\.use\(\s*(?:"([^"]+)"\s*,\s*)?(\w+Router)\s*\)/g;
const mountPrefix = {};
while ((m = useRe.exec(appSrc))) {
  const prefix = m[1] || "";
  const routerVar = m[2];
  if (mounts[routerVar]) mountPrefix[mounts[routerVar]] = prefix;
}

const METHODS = ["get", "post", "put", "patch", "delete"];
const liveRoutes = new Set();

for (const entry of fs.readdirSync(ROUTES_DIR)) {
  if (!entry.endsWith(".ts")) continue;
  const base = entry.replace(/\.ts$/, "");
  const routerVar = base + "Router";
  const prefix = mountPrefix[routerVar] ?? "";
  const src = fs.readFileSync(path.join(ROUTES_DIR, entry), "utf8");

  // Match router.<method>("...path...") and router.<method>(`...path...`)
  const re = /router\.(get|post|put|patch|delete)\(\s*(["'`])([^"'`]+)\2/g;
  let rm;
  while ((rm = re.exec(src))) {
    const method = rm[1].toUpperCase();
    let p = rm[3];
    if (p.includes("${")) continue; // skip programmatic template-literal routes
    // Convert Express path to OpenAPI-ish (keep :id style)
    const full = (prefix + p).replace(/\/+/g, "/");
    liveRoutes.add(`${method} ${full}`);
  }
}

// Spec paths: method + path lines
const specSrc = fs.readFileSync(SPEC, "utf8");
const specPaths = new Set();
const specPathRe = /method:\s*["'](get|post|put|patch|delete)["']/g;
// We match { path: "/x" } blocks; gather method+path pairs by scanning.
const blockRe = /path:\s*["'`]([^"'`]+)["'`][\s\S]*?method:\s*["'](get|post|put|patch|delete)["']/g;
while ((m = blockRe.exec(specSrc))) {
  specPaths.add(`${m[2].toUpperCase()} ${m[1].replace(/\/+/g, "/")}`);
}

const missing = [...liveRoutes].filter((r) => !specPaths.has(r)).sort();
console.log(`Live routes parsed: ${liveRoutes.size}`);
console.log(`Spec route entries: ${specPaths.size}`);
console.log(`MISSING from spec (${missing.length}):`);
for (const r of missing) console.log("  " + r);
