"use strict";

/**
 * Storybook 8.6 compatibility hooks for Next.js 16.
 *
 * Loaded from `.storybook/main.ts` before `@storybook/nextjs` is resolved.
 * It only changes module resolution inside the Storybook build process:
 *
 * 1. `next/config` was removed in Next.js 16 but is still imported by
 *    @storybook/nextjs's preview entry point. Redirect it to the shim in
 *    `.storybook/next/config.js`.
 * 2. `next/dist/build/swc` changed shape in Next.js 16 (`isWasm` removed,
 *    `loadBindings()` now required before `transform()`). Redirect it to a
 *    proxy that preserves the API Storybook 8.6 expects.
 *
 * Nothing here runs in the Next.js application itself.
 */

const Module = require("node:module");
const path = require("node:path");

const configShimPath = path.join(__dirname, "next", "config.js");
const swcCompatPath = path.join(__dirname, "next-swc-compat.cjs");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveNextCompatShims(request, parent, isMain, options) {
  if (request === "next/config") {
    return configShimPath;
  }

  if (request === "next/dist/build/swc") {
    const realPath = originalResolveFilename.call(this, request, parent, isMain, options);
    global.__nextSwcRealPath = realPath;
    return swcCompatPath;
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
