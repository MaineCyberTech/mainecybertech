import { defineConfig } from "tsup";

export default defineConfig({
  /**
   * EVOL-P2-001 / EVOL-P2-002: `@mct/sdk` is a source-only TypeScript
   * workspace package, so an external import would fail at runtime — the
   * Docker runtime stage ships only `dist` and does not carry `packages/`.
   * Bundle the two dependency-free shared catalogs into the API output
   * instead of leaving them external. Both files have no imports of their own,
   * so only the catalog code is inlined.
   */
  noExternal: [/^@mct\/sdk\/(module-registry|webhook-events)$/],
});
