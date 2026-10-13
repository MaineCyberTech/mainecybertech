import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";

const config: StorybookConfig = {
  stories: [
    "../apps/web/components/**/*.stories.@(ts|tsx)",
    "../packages/ui/src/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../apps/web/public"],
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@mct/ui": path.resolve(__dirname, "../packages/ui/src"),
      // App-component stories (apps/web/components/**/*.stories.tsx) import
      // through the web app's `@/` alias; there is no repo-root tsconfig for
      // Storybook to read it from (apps/web/tsconfig.json owns it).
      "@": path.resolve(__dirname, "../apps/web"),
    };
    return config;
  },
};

export default config;
