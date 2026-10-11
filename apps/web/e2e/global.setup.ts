import { test as setup, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin.real@mainecybertech.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "1";
const API_URL = process.env.E2E_API_URL ?? "http://localhost:4000";

setup("authenticate as admin", async ({ page }) => {
  // The API + local Supabase can take a moment to be fully ready after
  // db reset / container restart; retry the login so a single transient
  // failure doesn't fail the entire suite.
  let attempts = 0;
  for (;;) {
    attempts += 1;
    await page.goto("/login");
    await page.getByPlaceholder("name@clientdomain.com").fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /secure login/i }).click();
    try {
      await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: 15_000 });
      break;
    } catch (err) {
      if (attempts >= 3) throw err;
      // Deterministic backoff: wait until the API reports healthy instead of
      // sleeping a fixed 3s, which both raced a slow start and wasted time
      // when the API was already back (TEST-P2-003).
      await expect
        .poll(
          async () => {
            try {
              return (await page.request.get(`${API_URL}/health`)).status();
            } catch {
              return 0;
            }
          },
          { timeout: 15_000, intervals: [500, 1_000, 2_000] },
        )
        .toBe(200);
    }
  }
  await page.context().storageState({ path: ".playwright-auth.json" });
});
