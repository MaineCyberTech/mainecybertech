import { test, expect } from "../fixtures";

test.describe("admin webhooks page", () => {
  test("renders webhooks heading", async ({ page }) => {
    await page.goto("/admin/webhooks");
    await expect(page.getByRole("heading", { name: /webhook/i })).toBeVisible();
  });

  test("shows create button", async ({ page }) => {
    await page.goto("/admin/webhooks");
    await expect(page.getByRole("link", { name: /new webhook/i })).toBeVisible();
  });
});

test.describe("admin new webhook page", () => {
  test("renders new webhook form", async ({ page }) => {
    await page.goto("/admin/webhooks/new");
    await expect(page.getByRole("heading", { name: /new webhook/i })).toBeVisible();
  });

  test("has organization selector", async ({ page }) => {
    await page.goto("/admin/webhooks/new");
    await expect(page.getByText("Organization").first()).toBeVisible();
  });
});
