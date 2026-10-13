#!/usr/bin/env node
/**
 * GitHub Actions dependency inventory (SBOM-P3-008).
 *
 * The lockfile and image SBOMs do not enumerate the workflow dependencies the
 * repository executes in CI. This script walks `.github/workflows/**` and
 * `.github/actions/**`, extracts every `uses:` reference, and emits a
 * machine-readable inventory (name, pinned SHA, version comment, source file).
 *
 * Usage:
 *   node scripts/actions-inventory.mjs                 # JSON to stdout
 *   node scripts/actions-inventory.mjs --out <path>    # JSON to a file
 *   node scripts/actions-inventory.mjs --check         # fail on an unpinned
 *                                                      # external action ref
 *
 * Local composite actions (`uses: ./.github/actions/...`) are skipped: they are
 * part of this repository, not a third-party dependency.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const USE_RE = /^\s*(?:-\s*)?uses:\s*(.+?)\s*$/gm;
const SHA_RE = /^[0-9a-f]{40}$/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))) {
      files.push(full);
    }
  }
  return files;
}

const sourceFiles = [
  ...walk(join(ROOT, ".github/workflows")),
  ...walk(join(ROOT, ".github/actions")),
].sort();

const entries = [];
for (const file of sourceFiles) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(USE_RE)) {
      let ref = match[1].trim();
      const commentIndex = ref.indexOf("#");
      const version = commentIndex !== -1 ? ref.slice(commentIndex + 1).trim() : null;
      if (commentIndex !== -1) ref = ref.slice(0, commentIndex).trim();
      ref = ref.replace(/^["']|["']$/g, "");
      if (!ref || ref.startsWith("./")) continue;
      const [name, sha] = ref.split("@");
      entries.push({
        file: rel,
        line: index + 1,
        name,
        ref,
        sha: sha ?? null,
        version,
      });
    }
  });
}

const external = entries;
const unpinned = external.filter(
  (entry) => !entry.ref.startsWith("docker://") && !SHA_RE.test(entry.sha ?? ""),
);
const inventory = {
  generatedBy: "scripts/actions-inventory.mjs",
  source: "GitHub Actions `uses:` references across .github/workflows + .github/actions",
  total: external.length,
  pinned: external.length - unpinned.length,
  entries: external,
};

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
if (args.includes("--check")) {
  if (unpinned.length > 0) {
    console.error(`unpinned external action refs (${unpinned.length}):`);
    for (const entry of unpinned) {
      console.error(`  ${entry.file}:${entry.line} -> ${entry.ref}`);
    }
    process.exit(1);
  }
  console.log(`actions inventory OK: ${external.length} refs, all external actions SHA-pinned`);
  process.exit(0);
}

const json = `${JSON.stringify(inventory, null, 2)}\n`;
if (outIndex !== -1 && args[outIndex + 1]) {
  writeFileSync(resolve(ROOT, args[outIndex + 1]), json, "utf8");
  console.log(`wrote ${args[outIndex + 1]} (${external.length} refs)`);
} else {
  process.stdout.write(json);
}
