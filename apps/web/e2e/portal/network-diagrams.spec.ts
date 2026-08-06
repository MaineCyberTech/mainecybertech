import { test, expect } from "../fixtures";

test.describe("portal network diagrams page", () => {
  test("renders network diagrams heading", async ({ page }) => {
    await page.goto("/portal/network-diagrams");
    await expect(page.getByRole("heading", { name: /network diagrams/i })).toBeVisible();
  });

  test("shows diagram list or empty state", async ({ page }) => {
    await page.goto("/portal/network-diagrams");
    await expect(page.getByText(/network|diagram|site|vlan|device/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/network-diagrams");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
