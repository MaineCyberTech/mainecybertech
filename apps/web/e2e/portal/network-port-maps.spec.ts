import { test, expect } from "../fixtures";

test.describe("portal network port maps page", () => {
  test("renders network port maps heading", async ({ page }) => {
    await page.goto("/portal/network-port-maps");
    await expect(page.getByRole("heading", { name: /port maps/i })).toBeVisible();
  });

  test("shows port map list or empty state", async ({ page }) => {
    await page.goto("/portal/network-port-maps");
    await expect(page.getByText(/port|network|map/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/network-port-maps");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
