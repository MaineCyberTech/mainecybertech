import { defineConfig } from "tsup";

export default defineConfig({
  /**
   * EVOL-P2-001 / EVOL-P2-002 / EVOL-P3-005 / NOTIF-P3-001: `@mct/sdk` is a
   * source-only TypeScript workspace package, so an external import would fail
   * at runtime — the Docker runtime stage ships only `dist` and does not carry
   * `packages/`. Bundle the dependency-free shared catalogs, the email
   * template and the shared env-schema source (`@mct/config/env`) into the API
   * output. Their `zod` imports stay external — zod is a regular API
   * dependency present in the runtime image.
   */
  noExternal: [
    /^@mct\/sdk\/(module-registry|webhook-events|email-template)$/,
    /^@mct\/config\/env$/,
  ],
});
