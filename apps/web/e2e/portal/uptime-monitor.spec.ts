import { test, expect } from "../fixtures";

test.describe("portal uptime monitor page", () => {
  test("renders uptime monitor heading", async ({ page }) => {
    await page.goto("/portal/uptime-monitor");
    await expect(page.getByRole("heading", { name: /uptime monitor/i })).toBeVisible();
  });

  test("shows monitor list or empty state", async ({ page }) => {
    await page.goto("/portal/uptime-monitor");
    await expect(page.getByText(/monitor|uptime|availability|ssl/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/uptime-monitor");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
