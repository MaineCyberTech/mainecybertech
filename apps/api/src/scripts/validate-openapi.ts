import { buildSpec } from "../openapi/spec";

const spec = buildSpec();

let errors = 0;

if (!spec.openapi) {
  console.error("ERROR: spec missing openapi version");
  errors++;
}

if (!spec.info) {
  console.error("ERROR: spec missing info");
  errors++;
}

if (!spec.paths || Object.keys(spec.paths).length === 0) {
  console.error("ERROR: spec has no paths");
  errors++;
}

const pathCount = Object.keys(spec.paths).length;
process.stdout.write(`OpenAPI spec: ${pathCount} paths, ${spec.openapi} version\n`);

const missingSummaries: string[] = [];
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const method of ["get", "post", "put", "patch", "delete"] as const) {
    const op = (methods as Record<string, { summary?: string } | undefined>)[method];
    if (op && !op.summary) {
      missingSummaries.push(`${method.toUpperCase()} ${path}`);
    }
  }
}

if (missingSummaries.length > 0) {
  console.warn(`WARNING: ${missingSummaries.length} operations missing summary:`);
  missingSummaries.forEach((s) => console.warn(`  ${s}`));
}

if (errors > 0) {
  console.error(`FAILED: ${errors} validation errors`);
  process.exit(1);
}

process.stdout.write("OpenAPI spec validation passed\n");