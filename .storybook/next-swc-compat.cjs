"use strict";

/**
 * Compatibility wrapper for `next/dist/build/swc` used by Storybook 8.6.
 *
 * Next.js 16 removed the `isWasm` export and now requires `loadBindings()` to
 * complete before `transform()` can be called. Storybook 8.6's SWC loader
 * still uses the old API. This proxy keeps the old surface: `isWasm()` loads
 * the bindings before reporting false, and `transform()` awaits the bindings
 * before delegating to the real implementation.
 */

const Module = require("node:module");
const path = require("node:path");

const appRequire = Module.createRequire(path.join(__dirname, "..", "apps", "web", "package.json"));
const realSwc = appRequire(global.__nextSwcRealPath);

let bindingsPromise;

function ensureBindings() {
  bindingsPromise ??= realSwc.loadBindings();
  return bindingsPromise;
}

module.exports = new Proxy(realSwc, {
  get(target, property, receiver) {
    if (property === "isWasm") {
      return async () => {
        await ensureBindings();
        return false;
      };
    }

    if (property === "transform") {
      return async (source, options) => {
        await ensureBindings();
        return target.transform(source, options);
      };
    }

    return Reflect.get(target, property, receiver);
  },
});
