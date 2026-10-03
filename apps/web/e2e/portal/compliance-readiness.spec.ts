import { test, expect, setActiveOrg } from "../fixtures";

// Seed org that the GAP module demo data is scoped to (seed 06/08).
const GAP_ORG = "11111111-1111-1111-1111-111111111111";

test.describe("portal compliance readiness page", () => {
  test.beforeEach(async ({ page }) => {
    await setActiveOrg(page, GAP_ORG);
    await page.goto("/portal/compliance-readiness");
  });

  test("renders compliance readiness heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /compliance readiness/i })).toBeVisible();
  });

  test("shows compliance status or empty state", async ({ page }) => {
    await expect(page.getByText(/compliance|readiness|framework/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
