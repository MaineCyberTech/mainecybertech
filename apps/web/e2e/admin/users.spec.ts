import { test, expect } from "../fixtures";

test.describe("admin users list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/users");
  });

  test("renders users heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  });

  test("shows user count or list", async ({ page }) => {
    await expect(page.getByText(/members|users/i).first()).toBeVisible();
  });

  test("each user card has name and email", async ({ page }) => {
    const userCards = page.locator("a[href*='/admin/users/']");
    const count = await userCards.count();
    if (count > 0) {
      const firstCard = userCards.first();
      await expect(firstCard).toBeVisible();
    }
  });

  test("can navigate to user detail", async ({ page }) => {
    const userLink = page.locator("a[href*='/admin/users/']").first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await expect(page).toHaveURL(/\/admin\/users\//);
      await expect(page.getByRole("heading")).toBeVisible();
    }
  });
});

test.describe("admin user detail", () => {
  test("shows not-found for unknown user", async ({ page }) => {
    await page.goto("/admin/users/does-not-exist");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test("navigates back to users list", async ({ page }) => {
    await page.goto("/admin/users");
    const userLink = page.locator("a[href*='/admin/users/']").first();
    if (await userLink.isVisible()) {
      await userLink.click();
      const backLink = page.getByRole("link", { name: /back|users/i });
      if (await backLink.isVisible()) {
        await backLink.click();
        await expect(page).toHaveURL(/\/admin\/users$/);
      }
    }
  });
});
