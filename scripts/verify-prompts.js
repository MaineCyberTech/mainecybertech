/**
 * Prompt pack provenance + integrity verification (P2-1).
 *
 * Generates and (in verify mode) checks a cryptographic manifest of every file
 * under prompts/. This addresses the supply-chain risk flagged in the audit:
 * the 787 prompt/audit files have no pinning or provenance, so a malicious or
 * accidental edit goes unnoticed.
 *
 * Usage:
 *   node scripts/verify-prompts.js generate   # write prompts/manifest.json
 *   node scripts/verify-prompts.js verify     # check files match manifest (CI)
 *   node scripts/verify-prompts.js tree       # print per-pack SHA-256 tree hashes
 *
 * The manifest records, per file, its SHA-256 and path. Per-pack "tree" hashes
 * are computed over (path + content) so a change to any file changes its pack
 * hash. CI can run `node scripts/verify-prompts.js verify` as a cheap supply
 * chain guard.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PROMPTS_DIR = path.resolve(__dirname, "..", "prompts");
const MANIFEST = path.join(PROMPTS_DIR, "manifest.json");

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function listFiles() {
  if (!fs.existsSync(PROMPTS_DIR)) return [];
  return walk(PROMPTS_DIR)
    .map((f) => path.relative(PROMPTS_DIR, f).split(path.sep).join("/"))
    .filter((rel) => rel !== "manifest.json" && rel !== "PROVENANCE.md");
}

function fileHashes() {
  const files = listFiles().sort();
  const entries = {};
  for (const rel of files) {
    // Normalize line endings (CRLF -> LF) before hashing. Git's `* text=auto`
    // checks files out with platform-native EOLs (CRLF on Windows, LF on Linux),
    // so a byte-exact hash would spuriously fail the cross-platform CI gate.
    // Normalizing preserves detection of genuine content changes.
    const raw = fs.readFileSync(path.join(PROMPTS_DIR, rel));
    const normalized = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"));
    entries[rel] = sha256(normalized);
  }
  return entries;
}

function treeHash(packDir, entries) {
  const packPrefix = packDir + "/";
  const parts = Object.keys(entries)
    .filter((k) => k.startsWith(packPrefix) || packDir === "__root")
    .map((k) => `${k}\0${entries[k]}`)
    .sort((a, b) => a.localeCompare(b));
  const tree = entries["__tree__"] ?? null;
  if (parts.length === 0) return null;
  return sha256(parts.join("\n"));
}

function buildManifest() {
  const entries = fileHashes();
  const packHashes = {};
  const packs = fs
    .readdirSync(PROMPTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const pack of packs) {
    packHashes[pack] = treeHash(pack, entries);
  }
  const rootFiles = Object.keys(entries).filter((k) => !k.includes("/"));
  packHashes.__root = rootFiles.length
    ? sha256(rootFiles.map((k) => `${k}\0${entries[k]}`).join("\n"))
    : null;
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    fileCount: Object.keys(entries).length,
    packHashes,
    files: entries,
  };
}

function generate() {
  const manifest = buildManifest();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${MANIFEST} (${manifest.fileCount} files)`);
}

function verify() {
  if (!fs.existsSync(MANIFEST)) {
    console.error("No manifest.json found. Run: node scripts/verify-prompts.js generate");
    process.exit(1);
  }
  const expected = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const actual = fileHashes();

  const missing = Object.keys(expected.files ?? {}).filter((k) => !(k in actual));
  const added = Object.keys(actual).filter((k) => !(k in (expected.files ?? {})));
  const changed = Object.keys(actual).filter(
    (k) => k in (expected.files ?? {}) && expected.files[k] !== actual[k],
  );
  const packChanged = [];
  const currentPacks = fs.existsSync(PROMPTS_DIR)
    ? fs
        .readdirSync(PROMPTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];
  for (const pack of currentPacks) {
    const current = treeHash(pack, { ...actual, __tree__: null });
    if (current && expected.packHashes?.[pack] !== current) {
      const packFiles = Object.keys(actual).filter((k) => k.startsWith(pack + "/"));
      packChanged.push({ pack, current, changedFiles: packFiles.filter((k) => changed.includes(k)) });
    }
  }

  let ok = true;
  if (missing.length) {
    ok = false;
    console.error(`MISSING (in manifest, gone from disk):\n  ${missing.join("\n  ")}`);
  }
  if (added.length) {
    ok = false;
    console.error(`ADDED (on disk, not in manifest):\n  ${added.join("\n  ")}`);
  }
  if (changed.length) {
    ok = false;
    console.error(`CHANGED (content mismatch):\n  ${changed.join("\n  ")}`);
  }
  if (packChanged.length) {
    for (const p of packChanged) console.error(`PACK ${p.pack} changed: ${p.changedFiles.length} file(s)`);
  }

  if (ok) {
    console.log("Prompt provenance OK — all files match manifest.");
  } else {
    console.error("Prompt provenance MISMATCH. Regenerate only if changes are intended:\n  node scripts/verify-prompts.js generate");
    process.exit(1);
  }
}

function tree() {
  const manifest = buildManifest();
  for (const [pack, hash] of Object.entries(manifest.packHashes)) {
    console.log(`${hash}  ${pack}`);
  }
}

const mode = process.argv[2];
if (mode === "generate") generate();
else if (mode === "verify") verify();
else if (mode === "tree") tree();
else {
  console.log("Usage: node scripts/verify-prompts.js <generate|verify|tree>");
  process.exit(1);
}
