import { test, expect } from "../fixtures";

test.describe("admin audit export", () => {
  test("audit page shows export buttons", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByRole("link", { name: /download csv/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /download json/i })).toBeVisible();
  });

  test("csv export link has correct format", async ({ page }) => {
    await page.goto("/admin/audit");
    const csvLink = page.getByRole("link", { name: /download csv/i });
    const href = await csvLink.getAttribute("href");
    expect(href).toContain("format=csv");
  });
});
