import { test, expect } from "../fixtures";

test.describe("portal scoreboard page", () => {
  test("renders scoreboard heading", async ({ page }) => {
    await page.goto("/portal/scoreboard");
    await expect(
      page.getByRole("heading", { name: /scoreboard|scores|leaderboard/i }),
    ).toBeVisible();
  });

  test("shows score data or empty state", async ({ page }) => {
    await page.goto("/portal/scoreboard");
    await expect(page.getByText(/score|ranking|points/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/scoreboard");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
