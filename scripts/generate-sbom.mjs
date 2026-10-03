/**
 * Generate a CycloneDX 1.5 SBOM from pnpm-lock.yaml.
 *
 * Dependency-free on purpose: the lockfile is parsed with a small line parser so
 * this runs in CI without an extra install step. Usage:
 *
 *   node scripts/generate-sbom.mjs [outputPath]   # default: sbom.cdx.json
 *
 * Environment / flags:
 *   --licenses <path>  or  SBOM_LICENSES_JSON=<path>
 *       Optional `pnpm licenses list --json` output. When provided (or when the
 *       default `licenses.json` exists), each component gets a `licenses`
 *       entry. Without it the SBOM still emits a dependency graph and commit
 *       binding; licenses are simply omitted.
 *   SBOM_LICENSES_SCOPE=prod|all
 *       Only informational: controls the `scope` recorded for importer
 *       dependencies. Defaults to "all" (dev + prod) so the SBOM covers the
 *       full resolved tree.
 *
 * Output includes, per CycloneDX 1.5:
 *   - components[] with purl + integrity hashes + licenses (when available)
 *   - dependencies[] graph (root -> importers, package -> package)
 *   - serialNumber (deterministic UUID derived from content + commit)
 *   - metadata.component.version = "<product version>+<commit>" (REL-P1-001)
 *   - metadata.properties recording the git commit, product version and scope
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCKFILE = resolve(ROOT, "pnpm-lock.yaml");
const VERSION_FILE = resolve(ROOT, "VERSION");
const OUTPUT = resolve(ROOT, process.argv[2] ?? "sbom.cdx.json");

const argv = process.argv.slice(2);
const licensesFlag = argv.indexOf("--licenses");
const LICENSES_FILE =
  licensesFlag !== -1 && argv[licensesFlag + 1]
    ? resolve(ROOT, argv[licensesFlag + 1])
    : process.env.SBOM_LICENSES_JSON
      ? resolve(ROOT, process.env.SBOM_LICENSES_JSON)
      : resolve(ROOT, "licenses.json");

const ENTRY = /^ {2}(?! )(?:'([^']+)'|"([^"]+)"|([^:]+)):\s*$/;
const INTEGRITY = /^ {4}resolution: \{integrity: (sha\d+)-([A-Za-z0-9+/=]+)\}/;
// A snapshot dependency line: 6-space indent, quoted or bare key, scalar value.
const SNAPSHOT_DEP = /^ {6}(?:'([^']+)'|"([^"]+)"|([^:]+?)):\s*(.+?)\s*$/;

const HASH_ALG = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Return the top-level section body lines of a YAML document section. */
function sectionLines(lines, name) {
  const start = lines.findIndex((line) => line === `${name}:`);
  if (start === -1) return null;
  const body = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line && !line.startsWith(" ")) break;
    body.push(line);
  }
  return body;
}

function parsePackages(lines) {
  const body = sectionLines(lines, "packages");
  if (!body) throw new Error("packages: section not found in pnpm-lock.yaml");

  const packages = new Map();
  let current = null;

  for (const line of body) {
    const entry = line.match(ENTRY);
    if (entry) {
      current = entry[1] ?? entry[2] ?? entry[3].trim();
      packages.set(current, {});
      continue;
    }
    if (current) {
      const integrity = line.match(INTEGRITY);
      if (integrity) packages.get(current).integrity = integrity;
    }
  }

  return packages;
}

/**
 * Parse `snapshots:` -> Map<snapshotKey, { deps: Map<name, version> }>.
 * The `dependencies:` list holds concrete resolved versions (with peer
 * suffixes stripped for this purpose), which is exactly what we need to build
 * the CycloneDX dependency graph.
 */
function parseSnapshots(lines) {
  const body = sectionLines(lines, "snapshots");
  if (!body) return new Map();

  const snapshots = new Map();
  let current = null;
  let inDeps = false;

  for (const line of body) {
    const entry = line.match(ENTRY);
    if (entry) {
      current = entry[1] ?? entry[2] ?? entry[3].trim();
      snapshots.set(current, new Map());
      inDeps = false;
      continue;
    }
    if (!current) continue;

    if (/^ {4}dependencies:\s*$/.test(line)) {
      inDeps = true;
      continue;
    }
    // Any other nested block (optionalDependencies, peerDependencies, ...)
    // ends the dependencies block.
    if (/^ {4}\S/.test(line)) {
      inDeps = false;
    }
    if (!inDeps) continue;

    if (line.trim() === "") continue;
    const dep = line.match(SNAPSHOT_DEP);
    if (!dep) continue;
    const depName = unquote(dep[1] ?? dep[2] ?? dep[3]);
    let depVersion = unquote(dep[4]);
    // workspace links resolve to a local path, not a registry component
    if (depVersion.startsWith("link:")) continue;
    depVersion = depVersion.replace(/\(.*\)$/, "");
    snapshots.get(current).set(depName, depVersion);
  }

  return snapshots;
}

/**
 * Parse `importers:` -> Map<importerPath, { prod:Set, dev:Set }> of concrete
 * resolved versions keyed as "name@version".
 */
function parseImporters(lines) {
  const body = sectionLines(lines, "importers");
  if (!body) return new Map();

  const importers = new Map();
  let current = null;
  let bucket = null;
  let pending = null; // key of the dependency awaiting a `version:` line

  for (let i = 0; i < body.length; i += 1) {
    const line = body[i];
    const imp = line.match(/^ {2}(\S.*?):\s*$/);
    if (imp) {
      current = unquote(imp[1]);
      importers.set(current, { prod: new Map(), dev: new Map() });
      bucket = null;
      pending = null;
      continue;
    }
    if (!current) continue;

    if (/^ {4}dependencies:\s*$/.test(line)) {
      bucket = "dependencies";
      pending = null;
      continue;
    }
    if (/^ {4}devDependencies:\s*$/.test(line)) {
      bucket = "devDependencies";
      pending = null;
      continue;
    }
    if (/^ {4}\S/.test(line)) {
      bucket = null;
      pending = null;
      continue;
    }
    if (!bucket) continue;

    const dep = line.match(/^ {6}(?:'([^']+)'|"([^"]+)"|([^:]+?)):\s*$/);
    if (dep) {
      pending = { key: unquote(dep[1] ?? dep[2] ?? dep[3]) };
      continue;
    }
    if (!pending) continue;
    const version = line.match(/^ {8}version:\s*(.+?)\s*$/);
    if (version) {
      const value = unquote(version[1]);
      if (!value.startsWith("link:")) {
        const normalized = value.replace(/\(.*\)$/, "");
        const target =
          bucket === "devDependencies"
            ? importers.get(current).dev
            : importers.get(current).prod;
        target.set(pending.key, normalized);
      }
      pending = null;
    }
  }

  return importers;
}

function splitNameVersion(key) {
  const clean = key.replace(/^\//, "").replace(/\(.*\)$/, "");
  const at = clean.lastIndexOf("@");
  if (at <= 0) return { name: clean, version: "" };
  return { name: clean.slice(0, at), version: clean.slice(at + 1) };
}

function toPurl(name, version) {
  const encoded = name.startsWith("@") ? `%40${name.slice(1)}` : name;
  return `pkg:npm/${encoded}${version ? `@${version}` : ""}`;
}

/**
 * Read a JSON file, tolerating a UTF-8 BOM and UTF-16 output.
 *
 * Windows PowerShell redirection (`pnpm ... > licenses.json`) writes UTF-16LE
 * with a BOM, which `readFileSync(path, "utf8")` renders as garbage and
 * JSON.parse rejects. Detection is by BOM so correctly-encoded UTF-8 is
 * unaffected.
 */
function readJsonFile(path) {
  const buffer = readFileSync(path);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return JSON.parse(buffer.toString("utf16le").replace(/^\uFEFF/, ""));
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer);
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const tmp = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = tmp;
    }
    return JSON.parse(swapped.toString("utf16le").replace(/^\uFEFF/, ""));
  }
  return JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
}

/** Map of package name -> SPDX expression from `pnpm licenses list --json`. */
function loadLicenses() {
  if (!existsSync(LICENSES_FILE)) return new Map();
  const raw = readJsonFile(LICENSES_FILE);
  const map = new Map();
  for (const [license, packages] of Object.entries(raw)) {
    for (const pkg of packages) {
      if (pkg.name) map.set(pkg.name, license);
    }
  }
  return map;
}

/**
 * CycloneDX distinguishes a single SPDX *id* (`MIT`) from an SPDX *expression*
 * (`Apache-2.0 AND LGPL-3.0-or-later`). Emit the right one so the document
 * validates against the CycloneDX 1.5 schema.
 *
 * The CycloneDX 1.5 bundled SPDX enum lags the SPDX list (for example
 * `FSL-1.1-MIT`, a valid SPDX id since 2024, is absent), and schema-invalid
 * `id` values would fail a consumer's validation. For ids outside this
 * allowlist we emit `license.name` instead, which CycloneDX explicitly permits
 * for non-SPDX / not-yet-enumerated licenses.
 */
const SPDX_ID_ALLOWLIST = new Set([
  "0BSD", "Apache-2.0", "Artistic-2.0", "BSD-2-Clause", "BSD-3-Clause",
  "BlueOak-1.0.0", "CC-BY-4.0", "CC0-1.0", "ISC", "MIT", "MIT-0", "MPL-2.0",
  "Python-2.0", "Unlicense", "WTFPL", "Zlib", "BSD-4-Clause", "EPL-2.0",
  "LGPL-2.1-only", "LGPL-2.1-or-later", "LGPL-3.0-only", "LGPL-3.0-or-later",
  "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0-only", "GPL-3.0-or-later",
  "AGPL-3.0-only", "AGPL-3.0-or-later", "Apache-1.1", "CDDL-1.0", "CDDL-1.1",
  "EUPL-1.1", "EUPL-1.2", "MS-PL", "NCSA", "OpenSSL", "PostgreSQL", "X11",
  "UPL-1.0", "AFL-3.0", "BSD-3-Clause-Clear", "BSL-1.0",
]);

function toDependencyLicense(license) {
  const isExpression = /[\s()]|\bAND\b|\bOR\b|\bWITH\b/.test(license);
  if (isExpression) return { expression: license };
  if (SPDX_ID_ALLOWLIST.has(license)) return { license: { id: license } };
  return { license: { name: license } };
}

function readProductVersion() {
  if (existsSync(VERSION_FILE)) {
    const value = readFileSync(VERSION_FILE, "utf8").trim();
    if (value) return value;
  }
  return "0.0.0";
}

function commitSha() {
  return (
    process.env.GITHUB_SHA ||
    process.env.SBOM_COMMIT ||
    process.env.COMMIT_SHA ||
    ""
  );
}

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const lockText = readFileSync(LOCKFILE, "utf8");
const lines = lockText.split(/\r?\n/);
const packages = parsePackages(lines);
const snapshots = parseSnapshots(lines);
const importers = parseImporters(lines);
const licenseByName = loadLicenses();

const productVersion = readProductVersion();
const sha = commitSha();
const version = sha ? `${productVersion}+${sha}` : productVersion;
const rootRef = toPurl(rootPkg.name, version);

// Build components (deduped by bom-ref, since peer variants of the same
// name@version collapse to one CycloneDX component).
const componentsByRef = new Map();
for (const [key, meta] of packages) {
  const { name, version: pkgVersion } = splitNameVersion(key);
  if (!name || !pkgVersion) continue;
  const purl = toPurl(name, pkgVersion);
  if (componentsByRef.has(purl)) continue;

  const component = {
    type: "library",
    "bom-ref": purl,
    name,
    version: pkgVersion,
    purl,
    scope: "required",
  };
  if (meta.integrity) {
    component.hashes = [
      {
        alg: HASH_ALG[meta.integrity[1]] ?? meta.integrity[1].toUpperCase(),
        // Lockfile integrity is base64; CycloneDX requires a hex digest.
        content: Buffer.from(meta.integrity[2], "base64").toString("hex"),
      },
    ];
  }
  const license = licenseByName.get(name);
  if (license) component.licenses = [toDependencyLicense(license)];
  componentsByRef.set(purl, component);
}

const components = [...componentsByRef.values()].sort((a, b) =>
  a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name),
);

// dependency graph: bom-ref -> Set of dependency bom-refs
const graph = new Map();
const addEdge = (from, to) => {
  if (!graph.has(from)) graph.set(from, new Set());
  graph.get(from).add(to);
};

// root -> direct dependencies of every importer
const rootDeps = new Set();
const importerRefs = new Map();
for (const [importerPath, buckets] of importers) {
  const importerRef =
    importerPath === "."
      ? rootRef
      : toPurl(`mct-portal/${importerPath}`, version);
  if (importerPath !== ".") {
    componentsByRef.set(importerRef, {
      type: "application",
      "bom-ref": importerRef,
      name: importerPath,
      version,
      scope: "required",
    });
    importerRefs.set(importerPath, importerRef);
    rootDeps.add(importerRef);
  }
  for (const [name, pkgVersion] of [...buckets.prod, ...buckets.dev]) {
    const depRef = toPurl(name, pkgVersion);
    addEdge(importerRef, depRef);
  }
}
addEdge(rootRef, rootDeps.size ? [...rootDeps] : []);

// package -> package edges from snapshots
for (const [snapshotKey, deps] of snapshots) {
  const { name, version: pkgVersion } = splitNameVersion(snapshotKey);
  if (!name || !pkgVersion) continue;
  const fromRef = toPurl(name, pkgVersion);
  for (const [depName, depVersion] of deps) {
    addEdge(fromRef, toPurl(depName, depVersion));
  }
}

// Emit only refs that exist as components (drops workspace links / unresolved).
const knownRefs = new Set(componentsByRef.keys());
knownRefs.add(rootRef);
for (const [importerPath] of importers) {
  const ref = importerRefs.get(importerPath);
  if (ref) knownRefs.add(ref);
}

const dependencies = [...graph.entries()]
  .map(([ref, deps]) => ({
    ref,
    dependsOn: [...deps].filter((dep) => knownRefs.has(dep)).sort(),
  }))
  .filter((entry) => knownRefs.has(entry.ref))
  .sort((a, b) => a.ref.localeCompare(b.ref));

// Deterministic serialNumber: UUIDv5-style SHA-1 of the bom content + commit.
const digest = createHash("sha1")
  .update(JSON.stringify({ components, dependencies, sha, productVersion }))
  .digest("hex");
const serialNumber = `urn:uuid:${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;

const allComponents = [...components, ...importerRefs.values()].map((ref) =>
  componentsByRef.get(ref),
);
const uniqueComponents = new Map();
for (const component of [...components, ...allComponents]) {
  if (component) uniqueComponents.set(component["bom-ref"], component);
}
const sortedComponents = [...uniqueComponents.values()].sort((a, b) =>
  a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name),
);

const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [
      { vendor: "mainecybertech", name: "scripts/generate-sbom.mjs", version: "1.1.0" },
    ],
    component: {
      type: "application",
      "bom-ref": rootRef,
      name: rootPkg.name,
      version,
    },
    properties: [
      { name: "mct:productVersion", value: productVersion },
      { name: "mct:commit", value: sha || "(unset)" },
      { name: "mct:licenseDataSource", value: existsSync(LICENSES_FILE) ? "pnpm-licenses" : "none" },
    ],
  },
  components: sortedComponents,
  dependencies,
};

writeFileSync(OUTPUT, `${JSON.stringify(bom, null, 2)}\n`, "utf8");
const withLicenses = sortedComponents.filter((c) => c.licenses).length;
console.log(
  `Wrote ${sortedComponents.length} components (${withLicenses} with licenses) and ` +
    `${dependencies.length} dependency nodes to ${OUTPUT}`,
);
