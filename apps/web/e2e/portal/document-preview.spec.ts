import { test, expect } from "../fixtures";

test.describe("document preview", () => {
  test("documents page renders", async ({ page }) => {
    await page.goto("/portal/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });
});
