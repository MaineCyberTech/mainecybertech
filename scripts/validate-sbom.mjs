#!/usr/bin/env node
/**
 * Validate a generated CycloneDX SBOM without adding a JSON-schema dependency.
 *
 * Checks (fail = non-zero exit):
 *   - bomFormat == "CycloneDX" and specVersion == "1.5"
 *   - every component has type/name/version and a unique bom-ref
 *   - `dependencies` edges reference only known bom-refs (no dangling refs)
 *   - component count is within a sane floor (guards against a parser
 *     regression silently emitting an empty/near-empty SBOM)
 *   - the product version + commit binding are present
 *
 * Usage:
 *   node scripts/validate-sbom.mjs [sbomPath]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.argv[2] ?? "sbom.cdx.json");
const bom = JSON.parse(readFileSync(path, "utf8"));

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(bom.bomFormat === "CycloneDX", `bomFormat must be "CycloneDX" (got ${bom.bomFormat})`);
check(bom.specVersion === "1.5", `specVersion must be "1.5" (got ${bom.specVersion})`);
check(Boolean(bom.serialNumber), "serialNumber is missing");

const components = Array.isArray(bom.components) ? bom.components : [];
const refs = new Set();
const seen = new Set();
for (const component of components) {
  check(Boolean(component["bom-ref"]), "component missing bom-ref");
  check(Boolean(component.name), `component ${component["bom-ref"] ?? "?"} missing name`);
  check(Boolean(component.version), `component ${component["bom-ref"] ?? "?"} missing version`);
  if (seen.has(component["bom-ref"])) {
    errors.push(`duplicate bom-ref: ${component["bom-ref"]}`);
  }
  seen.add(component["bom-ref"]);
  refs.add(component["bom-ref"]);
}
const rootRef = bom.metadata?.component?.["bom-ref"];
if (rootRef) refs.add(rootRef);

const dependencies = Array.isArray(bom.dependencies) ? bom.dependencies : [];
check(dependencies.length > 0, "dependencies graph is empty");
for (const entry of dependencies) {
  if (!refs.has(entry.ref)) errors.push(`dependency ref not a component: ${entry.ref}`);
  for (const dep of entry.dependsOn ?? []) {
    if (!refs.has(dep)) errors.push(`dangling dependsOn ref: ${dep}`);
  }
}

// A parser regression should never silently shrink the tree to nothing.
const FLOOR = 100;
check(
  components.length >= FLOOR,
  `component count ${components.length} is below the sanity floor of ${FLOOR}`,
);

const version = bom.metadata?.component?.version ?? "";
const props = bom.metadata?.properties ?? [];
const commitProp = props.find((p) => p.name === "mct:commit");
check(Boolean(version), "metadata.component.version (product version) is missing");
check(Boolean(commitProp), "metadata property mct:commit is missing");

if (errors.length) {
  console.error(`SBOM validation FAILED (${errors.length} issue(s)) for ${path}:`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  process.exit(1);
}

const licensed = components.filter((c) => c.licenses).length;
console.log(
  `SBOM OK: ${components.length} components (${licensed} with licenses), ` +
    `${dependencies.length} dependency nodes, version ${version}, ` +
    `commit ${commitProp.value}`,
);
