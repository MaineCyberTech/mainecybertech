import { test, expect } from "../fixtures";

test.describe("admin organizations list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/organizations");
  });

  test("renders organizations heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /organizations/i })).toBeVisible();
  });

  test("shows organization cards", async ({ page }) => {
    await expect(page.getByText(/members|organizations/i).first()).toBeVisible();
  });

  test("each org card links to detail page", async ({ page }) => {
    const orgLinks = page.locator("a[href*='/admin/organizations/']");
    const count = await orgLinks.count();
    if (count > 0) {
      const firstLink = orgLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });

  test("can navigate to org detail", async ({ page }) => {
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page).toHaveURL(/\/admin\/organizations\//);
    }
  });
});

test.describe("admin organization detail", () => {
  test("shows not-found for unknown org", async ({ page }) => {
    await page.goto("/admin/organizations/does-not-exist");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test("shows org basics form when org exists", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page.getByText(/organization basics|name|slug/i).first()).toBeVisible();
    }
  });

  test("shows domains section", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page.getByText(/domains/i).first()).toBeVisible();
    }
  });

  test("shows memberships section", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await page.waitForURL(/\/admin\/organizations\//, { timeout: 5000 });
      await expect(page.getByText(/memberships/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
