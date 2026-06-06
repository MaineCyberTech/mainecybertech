import { test as setup, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin.real@mainecybertech.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "1";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("name@clientdomain.com").fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /secure login/i }).click();
  await expect(page).toHaveURL(/\/dashboard|\/admin/);
  await page.context().storageState({ path: ".playwright-auth.json" });
});
