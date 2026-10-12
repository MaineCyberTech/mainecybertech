#!/usr/bin/env node
/**
 * Circular-dependency guard (HYGIENE-P3-009).
 *
 * Fails (exit 1) when static `import` / `export ... from` / `require` /
 * dynamic `import()` edges between the repo's own TypeScript/JavaScript
 * modules close a cycle. Dependency-free by design (madge/eslint-plugin-import
 * would add a dependency for a check this small); resolution mirrors the
 * import styles used in this repo:
 *
 *   - relative specifiers ("../lib/x")
 *   - `@/`           -> apps/web
 *   - `@mct/ui`      -> packages/ui/src
 *   - `@mct/sdk`     -> packages/sdk/src
 *
 * Tests (`__tests__/`, `*.test.*`, `*.spec.*`, `e2e/`) are excluded: the
 * product import graph is what matters, and test helpers legitimately import
 * both sides of a layering boundary. Generated/build dirs are excluded too.
 *
 * Usage:
 *   node scripts/check-circular-deps.mjs              # scan the repo
 *   node scripts/check-circular-deps.mjs --self-test  # prove the detector fails on a cycle
 *
 * If a cycle is ever deliberately tolerated, add its canonical string
 * (`a.ts -> b.ts -> a.ts`) to ALLOWED_CYCLES with a comment explaining why;
 * everything else fails closed.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = [
  "apps/api/src",
  "apps/worker/src",
  "apps/web/app",
  "apps/web/components",
  "apps/web/lib",
  "packages/sdk/src",
  "packages/ui/src",
  "packages/config",
];

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  ".turbo",
  "coverage",
  "__tests__",
  "e2e",
]);

const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".cjs"];

const ALIASES = [
  { bare: "@", prefix: "@/", dir: "apps/web" },
  { bare: "@mct/ui", prefix: "@mct/ui/", dir: "packages/ui/src" },
  { bare: "@mct/sdk", prefix: "@mct/sdk/", dir: "packages/sdk/src" },
];

/** Empty baseline: the worker cycle was fixed in HYGIENE-P3-009. */
const ALLOWED_CYCLES = new Set([]);

const SPECIFIER_PATTERNS = [
  /\bfrom\s*["']([^"']+)["']/g, // import/export ... from "x"
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g, // dynamic import("x")
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g, // require("x")
  /\bimport\s*["']([^"']+)["']/g, // side-effect import "x"
];

function walkFiles(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walkFiles(full, out);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf(".");
      const ext = dot === -1 ? "" : entry.name.slice(dot);
      if (!EXTENSIONS.includes(ext)) continue;
      if (entry.name.endsWith(".d.ts") || /\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
        continue;
      }
      out.push(full);
    }
  }
  return out;
}

function resolveSpecifier(specifier, fromFile, nodes, root) {
  let base = null;
  if (specifier.startsWith(".")) {
    base = resolve(dirname(fromFile), specifier);
  } else {
    for (const alias of ALIASES) {
      if (specifier === alias.bare || specifier.startsWith(alias.prefix)) {
        const rest = specifier === alias.bare ? "" : specifier.slice(alias.prefix.length);
        base = rest ? join(root, alias.dir, rest) : join(root, alias.dir);
        break;
      }
    }
  }
  if (!base) return null;

  const candidates = [];
  const dot = base.lastIndexOf(".");
  if (dot > base.lastIndexOf("/") && EXTENSIONS.includes(base.slice(dot))) candidates.push(base);
  for (const ext of EXTENSIONS) candidates.push(`${base}${ext}`);
  for (const ext of EXTENSIONS) candidates.push(join(base, `index${ext}`));
  for (const candidate of candidates) {
    if (nodes.has(candidate)) return candidate;
  }
  return null;
}

function findCycles({ root, scanDirs }) {
  const files = [];
  for (const dir of scanDirs) walkFiles(join(root, dir), files);
  const nodes = new Set(files);
  const graph = new Map();

  for (const file of files) {
    let source = "";
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const specifiers = new Set();
    for (const pattern of SPECIFIER_PATTERNS) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
    }
    const edges = new Set();
    for (const specifier of specifiers) {
      const target = resolveSpecifier(specifier, file, nodes, root);
      if (target && target !== file) edges.add(target);
    }
    graph.set(file, [...edges]);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map([...graph.keys()].map((file) => [file, WHITE]));
  const stack = [];
  const cycles = [];

  const visit = (node) => {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const state = color.get(next);
      if (state === GRAY) {
        cycles.push([...stack.slice(stack.indexOf(next)), next]);
      } else if (state === WHITE) {
        visit(next);
      }
    }
    stack.pop();
    color.set(node, BLACK);
  };

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) visit(node);
  }

  return { files: graph.size, edges: [...graph.values()].reduce((n, e) => n + e.length, 0), cycles };
}

/** Rotate the cycle so the lexicographically smallest node comes first. */
function canonicalCycle(cycle, root) {
  const loop = cycle.slice(0, -1).map((file) => relative(root, file).split("\\").join("/"));
  let best = 0;
  for (let i = 1; i < loop.length; i += 1) {
    if (loop[i] < loop[best]) best = i;
  }
  const rotated = [...loop.slice(best), ...loop.slice(0, best)];
  return `${rotated.join(" -> ")} -> ${rotated[0]}`;
}

function report(cycles, root) {
  const newCycles = [];
  for (const cycle of cycles) {
    const canonical = canonicalCycle(cycle, root);
    if (ALLOWED_CYCLES.has(canonical)) {
      console.log(`ALLOWED cycle (baseline): ${canonical}`);
    } else {
      newCycles.push(canonical);
    }
  }
  if (newCycles.length) {
    console.error("Circular dependencies detected (HYGIENE-P3-009):");
    for (const cycle of newCycles) console.error(`  CYCLE: ${cycle}`);
    console.error("Break the cycle or document it in ALLOWED_CYCLES with a reason.");
    return false;
  }
  return true;
}

function runSelfTest() {
  const fixture = mkdtempSync(join(tmpdir(), "mct-circular-deps-"));
  try {
    mkdirSync(join(fixture, "src"));
    writeFileSync(join(fixture, "src", "a.ts"), 'import { b } from "./b";\nexport const a = b;\n');
    writeFileSync(join(fixture, "src", "b.ts"), 'import { a } from "./a";\nexport const b = a;\n');
    writeFileSync(join(fixture, "src", "clean.ts"), 'import { a } from "./a";\nexport const c = a;\n');

    const result = findCycles({ root: fixture, scanDirs: ["src"] });
    const detected = result.cycles.map((cycle) => canonicalCycle(cycle, fixture));
    const hasAb = detected.some((cycle) => cycle.includes("a.ts") && cycle.includes("b.ts"));
    const hasClean = detected.some((cycle) => cycle.includes("clean.ts"));
    if (result.cycles.length !== 1 || !hasAb || hasClean) {
      console.error(`self-test FAILED: expected exactly the a<->b cycle, got ${JSON.stringify(detected)}`);
      process.exit(1);
    }
    console.log("Circular-dependency guard self-test OK — synthetic cycle detected.");
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function runRepoCheck() {
  const { files, edges, cycles } = findCycles({ root: ROOT, scanDirs: SCAN_DIRS });
  if (!report(cycles, ROOT)) process.exit(1);
  console.log(`Circular-dependency check OK — ${files} files, ${edges} local edges, 0 cycles.`);
}

if (process.argv.includes("--self-test")) {
  runSelfTest();
} else if (!existsSync(join(ROOT, "apps"))) {
  console.error("Run from a checkout of the mct-portal repo.");
  process.exit(1);
} else {
  runRepoCheck();
}
