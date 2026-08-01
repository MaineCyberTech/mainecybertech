import { test, expect } from "../fixtures";

test.describe("portal knowledge base page", () => {
  test("renders knowledge base heading", async ({ page }) => {
    await page.goto("/portal/client-knowledge-base");
    await expect(page.getByRole("heading", { name: /knowledge base/i })).toBeVisible();
  });

  test("shows article list or empty state", async ({ page }) => {
    await page.goto("/portal/client-knowledge-base");
    await expect(page.getByText(/knowledge|article|guide/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/client-knowledge-base");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
