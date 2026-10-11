#!/usr/bin/env node
/**
 * Keeps the duplicated store catalog copies in sync (HYGIENE-P2-002).
 *
 * `apps/web/lib/catalog/data/products.json` is the canonical content source
 * (hand-authored marketing/fulfillment copy for all 245 products).
 * `apps/api/src/data/products.json` is the API fallback + `scripts/seed-store.ts`
 * source and must be byte-identical to it — before this guard the two copies
 * diverged for every product, so the same catalog read differently depending on
 * the surface.
 *
 * Usage:
 *   node scripts/sync-product-catalog.mjs sync    # copy canonical -> API mirror
 *   node scripts/sync-product-catalog.mjs check   # fail if the copies differ (CI)
 *
 * Edit the canonical web copy, then run `sync`; the shared unit-tests action
 * runs `check` so a one-sided edit cannot ship. The two copies inside
 * `prompts/mct-full-webstore-product-catalog-pack/` are vendored historical
 * snapshots pinned by `prompts/manifest.json` and are intentionally not synced.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL = "apps/web/lib/catalog/data/products.json";
const MIRROR = "apps/api/src/data/products.json";

const mode = process.argv[2];
if (mode === "sync") {
  const canonical = readFileSync(resolve(ROOT, CANONICAL));
  writeFileSync(resolve(ROOT, MIRROR), canonical);
  console.log(`Synced ${MIRROR} from ${CANONICAL} (${canonical.length} bytes)`);
} else if (mode === "check") {
  const canonical = readFileSync(resolve(ROOT, CANONICAL));
  const mirror = readFileSync(resolve(ROOT, MIRROR));
  if (canonical.equals(mirror)) {
    console.log(`Store catalog copies in sync (${canonical.length} bytes).`);
  } else {
    console.error(
      `Store catalog copies have drifted:\n  canonical: ${CANONICAL}\n  mirror:    ${MIRROR}\n` +
        "Edit the canonical web copy, then run: node scripts/sync-product-catalog.mjs sync",
    );
    process.exit(1);
  }
} else {
  console.log("Usage: node scripts/sync-product-catalog.mjs <sync|check>");
  process.exit(1);
}
