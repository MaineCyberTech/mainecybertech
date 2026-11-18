"use strict";

/**
 * Compatibility shim for `next/config`.
 *
 * Next.js 16 removed the deprecated `next/config` entry point, but
 * @storybook/nextjs 8.6.x still imports it from its preview entry point to
 * call `setConfig(process.env.__NEXT_RUNTIME_CONFIG)`. Storybook also aliases
 * the module in its webpack config. This shim preserves the tiny public API
 * (`getConfig` / `setConfig`) so the Storybook preview can load without
 * carrying a full Next.js runtime config implementation.
 *
 * This file intentionally lives at `.storybook/next/config.js`:
 * @storybook/nextjs's `scopedResolve()` resolves the alias path and strips the
 * trailing `.js`, so the resulting webpack alias is `.storybook/next/config`
 * and webpack resolves this file through its normal extension resolution.
 *
 * See .storybook/next-config-resolve.cjs for how this file is substituted.
 */

let runtimeConfig;

function getConfig() {
  return runtimeConfig;
}

function setConfig(configValue) {
  runtimeConfig = configValue;
}

module.exports = {
  __esModule: true,
  default: getConfig,
  getConfig,
  setConfig,
};
