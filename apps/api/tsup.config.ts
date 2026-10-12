import { defineConfig } from "tsup";

export default defineConfig({
  /**
<<<<<<< HEAD
   * EVOL-P2-001 / EVOL-P2-002: `@mct/sdk` is a source-only TypeScript
   * workspace package, so an external import would fail at runtime — the
   * Docker runtime stage ships only `dist` and does not carry `packages/`.
   * Bundle the two dependency-free shared catalogs into the API output
   * instead of leaving them external. Both files have no imports of their own,
   * so only the catalog code is inlined.
   *
   * EVOL-P3-005: `@mct/config/env` (shared env-schema source) is imported at
   * runtime by config/env.ts, so it must be bundled for the same reason. Its
   * `zod` import stays external — zod is a regular API dependency present in
   * the runtime image.
   */
  noExternal: [/^@mct\/sdk\/(module-registry|webhook-events)$/, /^@mct\/config\/env$/],
=======
   * EVOL-P2-001 / EVOL-P2-002 / NOTIF-P3-001: `@mct/sdk` is a source-only
   * TypeScript workspace package, so an external import would fail at runtime —
   * the Docker runtime stage ships only `dist` and does not carry `packages/`.
   * Bundle the dependency-free shared catalogs and the email template into the
   * API output instead of leaving them external.
   */
  noExternal: [/^@mct\/sdk\/(module-registry|webhook-events|email-template)$/],
>>>>>>> 3d08153c (fix(files,notif,webhooks): P3 batch — share limiter/TTL, upload errors, email template + unsubscribe, event catalog)
});
