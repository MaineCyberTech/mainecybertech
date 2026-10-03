import { test, expect, visibleWithin, clickOrGoto } from "../fixtures";

test.describe("admin projects list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/projects");
  });

  test("renders projects heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
  });

  test("shows project list or empty state", async ({ page }) => {
    const projectList = page.getByText(/no projects|project/i).first();
    await expect(projectList).toBeVisible();
  });

  test("each project links to detail page", async ({ page }) => {
    const projectLinks = page.locator("a[href*='/admin/projects/']");
    const count = await projectLinks.count();
    if (count > 0) {
      const firstLink = projectLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });
});

test.describe("admin project detail", () => {
  test("shows not-found for unknown project", async ({ page }) => {
    await page.goto("/admin/projects/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "Not Found", level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("link", { name: "Back to Admin Dashboard" })).toBeVisible();
  });

  test("shows project name and status when project exists", async ({ page }) => {
    await page.goto("/admin/projects");
    const projectLink = page.locator("a[href*='/admin/projects/']").first();
    if (await visibleWithin(projectLink)) {
      await clickOrGoto(page, projectLink);
      await expect(page.getByText(/project/i).first()).toBeVisible();
    }
  });

  test("shows task list section", async ({ page }) => {
    await page.goto("/admin/projects");
    const projectLink = page.locator("a[href*='/admin/projects/']").first();
    if (await visibleWithin(projectLink)) {
      await clickOrGoto(page, projectLink);
      await expect(page.getByText(/tasks|add task/i).first()).toBeVisible();
    }
  });
});
