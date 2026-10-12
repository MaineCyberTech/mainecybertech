#!/usr/bin/env node
/**
 * Validate a generated CycloneDX SBOM without adding a JSON-schema dependency.
 *
 * Lockfile mode (default) checks (fail = non-zero exit):
 *   - bomFormat == "CycloneDX" and specVersion == "1.5"
 *   - every component has type/name/version and a unique bom-ref
 *   - `dependencies` edges reference only known bom-refs (no dangling refs)
 *   - component count is within a sane floor (guards against a parser
 *     regression silently emitting an empty/near-empty SBOM)
 *   - the product version + commit binding are present
 *
 * Image mode (`--image`, SBOM-P3-005) checks the Trivy image SBOM:
 *   - bomFormat == "CycloneDX" (specVersion 1.5/1.6 accepted)
 *   - every component has a unique bom-ref/name/version
 *   - component count is above a floor (an empty/partial image SBOM must not
 *     be attested as the durable record for a digest)
 *   - metadata.component names the image and the document is bound to the
 *     image digest: `--digest sha256:...` asserts the exact pushed digest,
 *     otherwise any `sha256:` binding is required.
 *
 * Usage:
 *   node scripts/validate-sbom.mjs [sbomPath]
 *   node scripts/validate-sbom.mjs --image [--digest sha256:...] image-sbom.cdx.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const imageMode = args.includes("--image");
const digestIndex = args.indexOf("--digest");
const expectedDigest = digestIndex !== -1 ? args[digestIndex + 1] : null;
const positional = args.filter(
  (arg, index) => arg !== "--image" && arg !== "--digest" && index !== digestIndex + 1,
);
const path = resolve(positional[0] ?? "sbom.cdx.json");
const bom = JSON.parse(readFileSync(path, "utf8"));

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(bom.bomFormat === "CycloneDX", `bomFormat must be "CycloneDX" (got ${bom.bomFormat})`);
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

function fail(message) {
  console.error(message);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  process.exit(1);
}

if (imageMode) {
  // Trivy emits CycloneDX 1.5 (some versions 1.6); anything else means the
  // generator changed shape and the validator must be revisited.
  const specVersion = String(bom.specVersion ?? "");
  check(
    specVersion === "1.5" || specVersion === "1.6",
    `image specVersion must be "1.5" or "1.6" (got ${bom.specVersion})`,
  );

  const rootComponent = bom.metadata?.component ?? {};
  check(
    Boolean(rootComponent.name || rootComponent.purl),
    "metadata.component (image name/purl) is missing",
  );

  // A Trivy/SBOM regression that emits an empty or partial image SBOM would
  // still be attested and stored as the durable record for that digest, so
  // floor it. Real app images carry Alpine + node_modules contents (hundreds
  // of components); 10 only catches "effectively empty".
  const IMAGE_FLOOR = 10;
  check(
    components.length >= IMAGE_FLOOR,
    `image component count ${components.length} is below the sanity floor of ${IMAGE_FLOOR}`,
  );

  // Binding: the document must reference the image digest, and when the caller
  // knows which digest was pushed, it must be that exact one.
  const bindingText =
    JSON.stringify(bom.metadata ?? {}) +
    JSON.stringify(
      components.map((component) => ({
        name: component.name,
        purl: component.purl,
        properties: component.properties,
      })),
    );
  check(bindingText.includes("sha256:"), "image SBOM is not bound to a sha256: image digest");
  if (expectedDigest) {
    check(
      bindingText.includes(expectedDigest),
      `image SBOM is not bound to the expected digest ${expectedDigest}`,
    );
  }

  if (errors.length) fail(`Image SBOM validation FAILED (${errors.length} issue(s)) for ${path}:`);
  console.log(
    `Image SBOM OK: ${components.length} components, ` +
      `${rootComponent.name ?? rootComponent.purl}, ` +
      `bound to ${expectedDigest ?? "a sha256: digest"}`,
  );
  process.exit(0);
}

check(bom.specVersion === "1.5", `specVersion must be "1.5" (got ${bom.specVersion})`);

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
