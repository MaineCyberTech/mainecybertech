import { test, expect } from "../fixtures";

test.describe("admin powershell scripts", () => {
  test("renders PowerShell Script heading", async ({ page }) => {
    await page.goto("/admin/edu-automation/powershell");
    await expect(page.getByRole("heading", { name: /PowerShell Script/i })).toBeVisible();
  });

  test("shows script list or empty state", async ({ page }) => {
    await page.goto("/admin/edu-automation/powershell");
    await expect(page.getByText(/PowerShell|script|New Script/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/admin/edu-automation/powershell");
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });
});
