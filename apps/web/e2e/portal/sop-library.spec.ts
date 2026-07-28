import { test, expect } from "../fixtures";

test.describe("portal sop library page", () => {
  test("renders sop library heading", async ({ page }) => {
    await page.goto("/portal/sop-library");
    await expect(
      page.getByRole("heading", { name: /sop library|standard operating/i }),
    ).toBeVisible();
  });

  test("shows sop list or empty state", async ({ page }) => {
    await page.goto("/portal/sop-library");
    await expect(page.getByText(/sop|procedure|standard|operating/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/sop-library");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
