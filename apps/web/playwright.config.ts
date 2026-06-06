import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "../../.playwright-report" }], ["list"]],
  outputDir: "../../.playwright-results",

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },

  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright-auth.json",
      },
      dependencies: ["setup"],
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        port: 3000,
        cwd: process.cwd(),
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
