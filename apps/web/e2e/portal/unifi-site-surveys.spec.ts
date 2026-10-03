import { test, expect } from "../fixtures";

test.describe("portal unifi site surveys page", () => {
  test("renders unifi site surveys heading", async ({ page }) => {
    await page.goto("/portal/unifi-site-surveys");
    await expect(page.getByRole("heading", { name: /unifi site surveys/i })).toBeVisible();
  });

  test("shows site survey list or empty state", async ({ page }) => {
    await page.goto("/portal/unifi-site-surveys");
    await expect(page.getByText(/site survey|no site surveys available/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/unifi-site-surveys");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
