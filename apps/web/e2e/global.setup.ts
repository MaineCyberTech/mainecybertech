import { test as setup, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin.real@mainecybertech.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "1";

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
      // Retry login — transient failure after db reset
      await page.waitForTimeout(3_000);
    }
  }
  await page.context().storageState({ path: ".playwright-auth.json" });
});
