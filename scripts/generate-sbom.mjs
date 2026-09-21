/**
 * Generate a CycloneDX 1.5 SBOM from pnpm-lock.yaml.
 *
 * Dependency-free on purpose: the lockfile is parsed with a small line parser so
 * this runs in CI without an extra install step. Usage:
 *
 *   node scripts/generate-sbom.mjs [outputPath]   # default: sbom.cdx.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCKFILE = resolve(ROOT, "pnpm-lock.yaml");
const OUTPUT = resolve(ROOT, process.argv[2] ?? "sbom.cdx.json");

const ENTRY = /^ {2}(?! )(?:'([^']+)'|"([^"]+)"|([^:]+)):\s*$/;
const INTEGRITY = /^ {4}resolution: \{integrity: (sha\d+)-([A-Za-z0-9+/=]+)\}/;

const HASH_ALG = {
  sha1: "SHA-1",
  sha256: "SHA-256",
  sha384: "SHA-384",
  sha512: "SHA-512",
};

function parsePackages(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === "packages:");
  if (start === -1) throw new Error("packages: section not found in pnpm-lock.yaml");

  const packages = new Map();
  let current = null;

  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line && !line.startsWith(" ")) break;

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

const rootPkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const packages = parsePackages(readFileSync(LOCKFILE, "utf8"));

const components = [...packages.entries()]
  .map(([key, meta]) => {
    const { name, version } = splitNameVersion(key);
    const purl = toPurl(name, version);
    const component = {
      type: "library",
      "bom-ref": purl,
      name,
      version,
      purl,
      scope: "required",
    };
    if (meta.integrity) {
      component.hashes = [
        {
          alg: HASH_ALG[meta.integrity[1]] ?? meta.integrity[1].toUpperCase(),
          content: meta.integrity[2],
        },
      ];
    }
    return component;
  })
  .filter((component) => component.name && component.version)
  .sort((a, b) =>
    a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name),
  );

const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [{ vendor: "mainecybertech", name: "scripts/generate-sbom.mjs", version: "1.0.0" }],
    component: {
      type: "application",
      "bom-ref": toPurl(rootPkg.name, rootPkg.version),
      name: rootPkg.name,
      version: rootPkg.version,
    },
  },
  components,
};

writeFileSync(OUTPUT, `${JSON.stringify(bom, null, 2)}\n`, "utf8");
console.log(`Wrote ${components.length} components to ${OUTPUT}`);
