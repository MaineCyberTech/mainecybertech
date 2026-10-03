import { test, expect } from "../fixtures";

test.describe("portal ai triage page", () => {
  test("renders AI triage heading", async ({ page }) => {
    await page.goto("/portal/ai-triage");
    await expect(page.getByRole("heading", { name: /ai triage/i })).toBeVisible();
  });

  test("shows triage list or empty state", async ({ page }) => {
    await page.goto("/portal/ai-triage");
    await expect(page.getByText(/triage|category|priority|confidence/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/ai-triage");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
