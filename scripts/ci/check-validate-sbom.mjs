#!/usr/bin/env node
/**
 * Self-test for scripts/validate-sbom.mjs argument handling (SBOM-P3-010).
 *
 * The validator used to drop its first positional path when --digest was
 * absent (`index !== digestIndex + 1` with digestIndex === -1), so
 * `node scripts/validate-sbom.mjs custom.cdx.json` silently validated
 * ./sbom.cdx.json instead. This harness writes minimal SBOM fixtures to a
 * temp directory and asserts the real validator:
 *
 *   1. validates an explicit positional lockfile path with no --digest (the
 *      regression), and fails when only the default name exists;
 *   2. still validates the default ./sbom.cdx.json with no arguments;
 *   3. still accepts `--image --digest <sha256:...> <path>` and rejects a
 *      digest mismatch;
 *   4. rejects --digest without a value.
 *
 * Usage: node scripts/ci/check-validate-sbom.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const VALIDATOR = resolve(import.meta.dirname, "..", "validate-sbom.mjs");

const failures = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok: ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function runValidator(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [VALIDATOR, ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output: stdout };
  } catch (error) {
    return {
      code: typeof error.status === "number" ? error.status : 1,
      output: `${error.stdout ?? ""}${error.stderr ?? ""}`,
    };
  }
}

/** Minimal valid lockfile SBOM: 100 components, a dependency per ref. */
function lockfileSbom() {
  const components = Array.from({ length: 100 }, (_, i) => ({
    type: "library",
    "bom-ref": `pkg:npm/dep-${i}@1.0.${i}`,
    name: `dep-${i}`,
    version: `1.0.${i}`,
  }));
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: "urn:uuid:11111111-1111-4111-8111-111111111111",
    metadata: {
      component: { "bom-ref": "root", name: "fixture", version: "0.1.0" },
      properties: [{ name: "mct:commit", value: "deadbeef" }],
    },
    components,
    dependencies: components.map((component) => ({ ref: component["bom-ref"], dependsOn: [] })),
  };
}

/** Minimal valid image SBOM: 10 components, bound to a sha256 digest. */
function imageSbom(digest) {
  const components = Array.from({ length: 10 }, (_, i) => ({
    type: "library",
    "bom-ref": `pkg:apk/alpine/package-${i}@1.0.${i}`,
    name: `package-${i}`,
    version: `1.0.${i}`,
  }));
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: "urn:uuid:22222222-2222-4222-8222-222222222222",
    metadata: {
      component: {
        "bom-ref": "image",
        name: "ghcr.io/mainecybertech/mct-api",
        purl: `pkg:oci/mct-api@${digest}`,
        properties: [{ name: "mct:imageDigest", value: digest }],
      },
    },
    components,
  };
}

const workDir = mkdtempSync(join(tmpdir(), "validate-sbom-"));

// 1. Positional path without --digest must be honored (SBOM-P3-010).
writeFileSync(join(workDir, "custom.cdx.json"), JSON.stringify(lockfileSbom()));
let result = runValidator(["custom.cdx.json"], workDir);
check(
  "explicit positional lockfile path is validated (no --digest)",
  result.code === 0 && result.output.includes("SBOM OK"),
  `exit ${result.code}: ${result.output.trim().split("\n")[0]}`,
);

// The same call must fail when the custom path does not exist (proving the
// positional path is used, not the coincidental default name).
result = runValidator(["missing.cdx.json"], workDir);
check(
  "missing positional path fails instead of falling back to the default",
  result.code !== 0,
  `exit ${result.code}`,
);

// 2. Default ./sbom.cdx.json still works with no arguments.
const defaultDir = join(workDir, "default");
mkdirSync(defaultDir);
writeFileSync(join(defaultDir, "sbom.cdx.json"), JSON.stringify(lockfileSbom()));
result = runValidator([], defaultDir);
check(
  "default ./sbom.cdx.json is validated with no arguments",
  result.code === 0 && result.output.includes("SBOM OK"),
  `exit ${result.code}: ${result.output.trim().split("\n")[0]}`,
);

// 3. Image mode: positional path + --digest still work together.
const digest = `sha256:${"a".repeat(64)}`;
writeFileSync(join(workDir, "image.cdx.json"), JSON.stringify(imageSbom(digest)));
result = runValidator(["--image", "--digest", digest, "image.cdx.json"], workDir);
check(
  "--image --digest <sha256:...> plus a positional path is validated",
  result.code === 0 && result.output.includes("Image SBOM OK"),
  `exit ${result.code}: ${result.output.trim().split("\n")[0]}`,
);

result = runValidator(["--image", "--digest", `sha256:${"b".repeat(64)}`, "image.cdx.json"], workDir);
check("digest mismatch fails", result.code !== 0, `exit ${result.code}`);

result = runValidator(["--image", "image.cdx.json"], workDir);
check(
  "--image without --digest accepts any sha256 binding",
  result.code === 0 && result.output.includes("Image SBOM OK"),
  `exit ${result.code}: ${result.output.trim().split("\n")[0]}`,
);

// 4. --digest without a value is rejected as a usage error, not a default read.
result = runValidator(["--image", "--digest"], workDir);
check(
  "--digest without a value is rejected",
  result.code !== 0 && result.output.includes("--digest requires"),
  `exit ${result.code}: ${result.output.trim().split("\n")[0]}`,
);

if (failures.length > 0) {
  console.error(`validate-sbom argument self-test FAILED (${failures.length} issue(s))`);
  process.exit(1);
}
console.log("validate-sbom argument self-test OK");
