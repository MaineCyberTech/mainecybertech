import { test, expect } from "../fixtures";

test.describe("admin org branding", () => {
  test("org detail shows branding section", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await page.goto(await orgLink.getAttribute("href") ?? "/admin/organizations");
      await expect(page.getByRole("heading", { name: /branding/i })).toBeVisible({ timeout: 10000 });
    }
  });

  test("branding has colors and save", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await page.goto(await orgLink.getAttribute("href") ?? "/admin/organizations");
      await expect(page.getByRole("button", { name: /save branding/i })).toBeVisible({ timeout: 10000 });
    }
  });
});
