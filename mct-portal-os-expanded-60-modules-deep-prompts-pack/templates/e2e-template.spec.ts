import { test, expect } from "@playwright/test";
test("loads module page", async ({ page }) => { await page.goto("/portal/REPLACE"); await expect(page.locator("h1")).toBeVisible(); });
