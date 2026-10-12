import { defineConfig } from "tsup";

export default defineConfig({
  /**
   * EVOL-P3-005 / NOTIF-P3-001: `@mct/config/env` and `@mct/sdk` are
   * source-only TypeScript workspace packages (package.json exports point at
   * `src/`), and the Docker runtime stage ships only `dist` plus
   * `node_modules` — not `packages/`. Bundle the shared env-schema source and
   * the dependency-free email template into the worker output so the
   * externalized workspace imports cannot fail at runtime. Their `zod` imports
   * stay external (regular worker dependencies present in the image).
   */
  noExternal: [/^@mct\/config\/env$/, /^@mct\/sdk\/email-template$/],
});
