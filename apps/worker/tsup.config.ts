import { defineConfig } from "tsup";

export default defineConfig({
  /**
<<<<<<< HEAD
   * EVOL-P3-005: `@mct/config/env` is a source-only TypeScript workspace
   * package (package.json exports point at `src/env.ts`), and the Docker
   * runtime stage ships only `dist` plus `node_modules` — not `packages/`.
   * Bundle the shared env-schema source into the worker output so the
   * externalized workspace import cannot fail at runtime. Its `zod` import
   * stays external (a regular worker dependency present in the image).
   */
  noExternal: [/^@mct\/config\/env$/],
=======
   * NOTIF-P3-001: `@mct/sdk` is a source-only TypeScript workspace package, so
   * an external import would fail at runtime — the Docker runtime stage ships
   * only `dist` and does not carry `packages/`. Bundle the dependency-free
   * shared email template into the worker output instead of leaving it
   * external (same pattern as the API's tsup.config.ts).
   */
  noExternal: [/^@mct\/sdk\/email-template$/],
>>>>>>> 3d08153c (fix(files,notif,webhooks): P3 batch — share limiter/TTL, upload errors, email template + unsubscribe, event catalog)
});
