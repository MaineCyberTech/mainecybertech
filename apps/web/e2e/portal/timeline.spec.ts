import { test, expect } from "../fixtures";

test.describe("portal timeline page", () => {
  test("renders timeline heading", async ({ page }) => {
    await page.goto("/portal/timeline");
    await expect(page.getByRole("heading", { name: /project timeline/i })).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    await page.goto("/portal/timeline");
    await expect(page.getByText(/projects|tasks|upcoming/i).first()).toBeVisible();
  });

  test("has timeline section", async ({ page }) => {
    await page.goto("/portal/timeline");
    await expect(page.getByText(/timeline/i).first()).toBeVisible();
  });

  test("has calendar section", async ({ page }) => {
    await page.goto("/portal/timeline");
    await expect(page.getByText(/calendar/i).first()).toBeVisible();
  });

  test("zoom controls are present", async ({ page }) => {
    await page.goto("/portal/timeline");
    await expect(page.getByRole("button", { name: /week|month|quarter/i }).first()).toBeVisible();
  });
});

test.describe("portal project task views", () => {
  test("project detail has view toggles", async ({ page }) => {
    await page.goto("/portal/projects");
    const projectLink = page.locator("a[href*='/portal/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page.getByRole("button", { name: /list|timeline|calendar/i }).first()).toBeVisible();
    }
  });

  test("can switch to timeline view", async ({ page }) => {
    await page.goto("/portal/projects");
    const projectLink = page.locator("a[href*='/portal/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      const timelineBtn = page.getByRole("button", { name: /timeline/i });
      if (await timelineBtn.isVisible()) {
        await timelineBtn.click();
        await expect(page.getByText(/tasks with due dates/i).or(page.getByText(/no tasks/i))).toBeVisible();
      }
    }
  });

  test("timeline page link is in subnav", async ({ page }) => {
    await page.goto("/portal/dashboard");
    await expect(page.getByRole("link", { name: /timeline/i })).toBeVisible();
  });
});
