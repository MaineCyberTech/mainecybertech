import { test, expect } from "../fixtures";

test.describe("portal tabletop page", () => {
  test("renders tabletop heading", async ({ page }) => {
    await page.goto("/portal/tabletop");
    await expect(page.getByRole("heading", { name: /tabletop|exercise/i })).toBeVisible();
  });

  test("shows tabletop list or empty state", async ({ page }) => {
    await page.goto("/portal/tabletop");
    await expect(page.getByText(/tabletop|exercise|scenario/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/tabletop");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
