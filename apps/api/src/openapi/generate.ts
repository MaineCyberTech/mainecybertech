/**
 * Generate docs/openapi.yaml from buildSpec() (P2-8).
 *
 * The API serves /api/v1/openapi.json at runtime from buildSpec(); this script
 * writes a static snapshot to docs/openapi.yaml for offline tooling. Run via
 * `pnpm --filter=api generate:openapi`.
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { buildSpec } from "./spec";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function serialize(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value.map((v) => `${pad}- ${serialize(v, indent + 1).trimStart()}`).join("\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    return keys
      .map((k) => {
        const v = obj[k];
        const isComplex = v !== null && typeof v === "object";
        const keyOut = /^[A-Za-z0-9_-]+$/.test(k) ? k : JSON.stringify(k);
        if (isComplex && !Array.isArray(v)) {
          return `${pad}${keyOut}:\n${serialize(v, indent + 1)}`;
        }
        if (Array.isArray(v) && (v as unknown[]).length === 0) {
          return `${pad}${keyOut}: []`;
        }
        if (Array.isArray(v)) {
          return `${pad}${keyOut}:\n${serialize(v, indent + 1)}`;
        }
        return `${pad}${keyOut}: ${typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v)}`;
      })
      .join("\n");
  }
  return `${pad}${typeof value === "string" ? JSON.stringify(value) : String(value)}`;
}

const spec = buildSpec();
const yaml =
  "# MCT Client Portal API - OpenAPI 3.0.3\n" +
  "# AUTO-GENERATED from apps/api/src/openapi/spec.ts (buildSpec()) - do not edit by hand.\n" +
  "# Regenerate with: pnpm --filter=api generate:openapi\n" +
  serialize(spec) +
  "\n";

const out = resolve(__dirname, "..", "..", "..", "..", "docs", "openapi.yaml");
writeFileSync(out, yaml);
// eslint-disable-next-line no-console
console.log(`Wrote ${out}`);
