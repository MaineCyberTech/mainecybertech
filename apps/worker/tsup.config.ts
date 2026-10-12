import { defineConfig } from "tsup";

export default defineConfig({
  /**
   * EVOL-P3-005: `@mct/config/env` is a source-only TypeScript workspace
   * package (package.json exports point at `src/env.ts`), and the Docker
   * runtime stage ships only `dist` plus `node_modules` — not `packages/`.
   * Bundle the shared env-schema source into the worker output so the
   * externalized workspace import cannot fail at runtime. Its `zod` import
   * stays external (a regular worker dependency present in the image).
   */
  noExternal: [/^@mct\/config\/env$/],
});
