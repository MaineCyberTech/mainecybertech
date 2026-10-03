#!/usr/bin/env node
/**
 * Collect a package -> license map from the INSTALLED tree.
 *
 * Why this exists (CI regression on PR #30): our workflows called
 *   pnpm licenses list --json > licenses.json
 * which, on pnpm v10.34.3 after any install, exits 1 and writes
 *   {"error":{"code":"ERR_PNPM_MISSING_PACKAGE_INDEX_FILE", ...}}
 * to STDOUT. Because it writes to stdout, the shell redirect produced a
 * licenses.json containing an error object, and the next step (the SBOM
 * generator / license gate) then failed. Reproduced on a clean Linux clone:
 * it fails with --frozen-lockfile, without it, with a fresh store dir, and with
 * --prod / --long. `pnpm list` works but carries no license field.
 *
 * So read the licenses from `node_modules` directly. This is what the license
 * gate and the SBOM generator actually want, it needs no network, and it cannot
 * silently produce an error document.
 *
 * Output shape matches `pnpm licenses list --json` closely enough for our
 * consumers: { "<SPDX expression>": [ { name, versions, paths } ] }, which is
 * what scripts/generate-sbom.mjs (loadLicenses) and scripts/license-gate.mjs
 * expect.
 *
 * Usage: node scripts/collect-licenses.mjs [--out licenses.json]
 *        (default: write to stdout)
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const PNPM_DIR = "node_modules/.pnpm";

/** Read a package.json, tolerating a BOM / UTF-16 (Windows tooling). */
function readJson(path) {
  const buf = readFileSync(path);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return JSON.parse(buf.toString("utf16le").replace(/^\uFEFF/, ""));
  }
  return JSON.parse(buf.toString("utf8").replace(/^\uFEFF/, ""));
}

/** Normalise the many shapes a license can take into an SPDX-ish string. */
function licenseOf(pkg) {
  if (typeof pkg.license === "string" && pkg.license.trim()) return pkg.license.trim();
  if (pkg.license && typeof pkg.license === "object" && pkg.license.type) {
    return String(pkg.license.type);
  }
  if (Array.isArray(pkg.licenses)) {
    const parts = pkg.licenses
      .map((l) => (typeof l === "string" ? l : l && l.type))
      .filter(Boolean);
    if (parts.length) return parts.join(" OR ");
  }
  return "UNKNOWN";
}

/** The dir name in .pnpm is "<name>@<version>" (scoped: "@scope+name@<version>"). */
function splitDirName(dir) {
  const at = dir.lastIndexOf("@");
  if (at <= 0) return { name: dir, version: "" };
  const name = dir.slice(0, at).replace("+", "/");
  return { name, version: dir.slice(at + 1) };
}

let dirs;
try {
  dirs = readdirSync(PNPM_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
} catch {
  console.error(
    `error: ${PNPM_DIR} not found - run "pnpm install" first (this script reads the installed tree).`,
  );
  process.exit(1);
}

// license expression -> Map(name@version -> path)
const byLicense = new Map();
let withLicense = 0;
let unknown = 0;

for (const dir of dirs) {
  const { name, version } = splitDirName(dir);
  const pkgPath = join(PNPM_DIR, dir, "node_modules", name, "package.json");
  let pkg;
  try {
    pkg = readJson(pkgPath);
  } catch {
    continue; // not a real package dir (link target missing, etc.)
  }
  const lic = licenseOf(pkg);
  if (lic === "UNKNOWN") unknown += 1;
  else withLicense += 1;

  if (!byLicense.has(lic)) byLicense.set(lic, new Map());
  byLicense.get(lic).set(`${name}@${version}`, pkgPath);
}

const out = {};
for (const [lic, pkgs] of [...byLicense.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  out[lic] = [...pkgs.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([nv, path]) => {
      const at = nv.lastIndexOf("@");
      return { name: nv.slice(0, at), versions: [nv.slice(at + 1)], paths: [path] };
    });
}

const json = JSON.stringify(out, null, 2);
const target = process.argv.indexOf("--out");
if (target !== -1 && process.argv[target + 1]) {
  writeFileSync(process.argv[target + 1], json + "\n", "utf8");
  console.error(
    `wrote ${process.argv[target + 1]} (${dirs.length} packages: ${withLicense} with a license, ${unknown} unknown)`,
  );
} else {
  process.stdout.write(json + "\n");
  console.error(`${dirs.length} packages: ${withLicense} with a license, ${unknown} unknown`);
}
