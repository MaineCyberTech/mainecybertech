import { test, expect } from "../fixtures";

test.describe("portal insurance binder page", () => {
  test("renders insurance evidence heading", async ({ page }) => {
    await page.goto("/portal/insurance-binder");
    await expect(page.getByRole("heading", { name: /insurance evidence/i })).toBeVisible();
  });

  test("shows evidence list or empty state", async ({ page }) => {
    await page.goto("/portal/insurance-binder");
    await expect(
      page.getByText(/insurance|evidence|coverage|coverage area/i).first(),
    ).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/insurance-binder");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
