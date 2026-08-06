import { test, expect } from "../fixtures";

test.describe("portal vendor contracts page", () => {
  test("renders vendor contracts heading", async ({ page }) => {
    await page.goto("/portal/vendor-contracts");
    await expect(page.getByRole("heading", { name: /vendor contracts/i })).toBeVisible();
  });

  test("shows contract list or empty state", async ({ page }) => {
    await page.goto("/portal/vendor-contracts");
    await expect(page.getByText(/vendor|contract|renewal|expir|found/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/vendor-contracts");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
