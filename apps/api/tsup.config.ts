import { defineConfig } from "tsup";

export default defineConfig({
  /**
<<<<<<< HEAD
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
=======
   * EVOL-P2-001 / EVOL-P2-002 / ADMIN-P3-001 / FEAT-P3-006: `@mct/sdk` is a
   * source-only TypeScript workspace package, so an external import would fail
   * at runtime — the Docker runtime stage ships only `dist` and does not carry
   * `packages/`. Bundle the dependency-free shared catalogs/helpers into the API
   * output instead of leaving them external. Each file has no imports of its
   * own, so only the catalog code is inlined.
   *
   * EVOL-P3-005: `@mct/config/env` (shared env-schema source) is imported at
   * runtime by config/env.ts, so it must be bundled for the same reason. Its
   * `zod` import stays external — zod is a regular API dependency present in
   * the runtime image.
   */
  noExternal: [
    /^@mct\/sdk\/(module-registry|role-keys|ticket-status|webhook-events)$/,
>>>>>>> 790e6b80 (fix(features,admin,search): P3 batch — store previews, scorecard docs, orphan table, ticket transitions, admin-gate parity, search contracts)
    /^@mct\/config\/env$/,
  ],
});
