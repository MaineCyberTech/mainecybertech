import type { Locator, Page } from "@playwright/test";
import { test, expect, gotoApp } from "./fixtures";

/**
 * MOB-P2-003: mobile-viewport coverage.
 *
 * Runs only in the mobile-chrome / mobile-safari projects (see
 * playwright.config.ts); the desktop chromium project ignores this file so the
 * below-sm assertions are never evaluated at desktop widths.
 */

const PHONE_VIEWPORT = { width: 360, height: 800 };
const PUBLIC_ROUTES = ["/store", "/store/quote", "/contact", "/login"];

async function visibleControlFontSizes(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"))
      .filter((el) => {
        if (el instanceof HTMLInputElement && el.type === "hidden") return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => ({
        name: el.id || el.getAttribute("name") || el.tagName.toLowerCase(),
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
      })),
  );
}

async function expectNoControlBelow16px(page: Page, route: string) {
  const controls = await visibleControlFontSizes(page);
  expect(controls.length, `expected visible form controls on ${route}`).toBeGreaterThan(0);
  expect(
    controls.filter((control) => control.fontSize < 16),
    `form controls below the 16px iOS focus-zoom floor on ${route}`,
  ).toEqual([]);
}

/**
 * MOB-P3-002: icon-only controls must offer at least a 44x44 border box. The
 * padding is paired with negative margins so the glyph keeps its position.
 */
async function expectMinTouchTarget(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${name}: no bounding box`).not.toBeNull();
  if (box) {
    expect(Math.round(box.width), `${name}: width`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box.height), `${name}: height`).toBeGreaterThanOrEqual(44);
  }
}

test.describe("mobile viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT);
  });

  // MOB-P3-006: the previous fixme exempted /login, /store and /store/quote
  // from the earlier measurements (369/372 vs 360, intermittent on
  // /store/quote). A fresh mobile-WebKit measurement of the deployed build
  // (2026-10-14, 360x800) shows scrollWidth == innerWidth on all three, so the
  // exemption looked stale. next/font swaps from the fallback font, whose
  // metrics differ, so wait for the fonts to settle before measuring — the
  // main source of run-to-run variance — and enforce every route: a real
  // overflow must fail the gate rather than be exempted.
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        scrollWidth,
        `${route} overflows horizontally (scrollWidth ${scrollWidth} > viewport ${innerWidth})`,
      ).toBeLessThanOrEqual(innerWidth + 1);
    });
  }

  test("quote form controls render at 16px or larger", async ({ page }) => {
    await page.goto("/store/quote");
    await page.waitForLoadState("domcontentloaded");
    // The quote builder is client-rendered behind a `loaded` gate. Wait for an
    // actual form control before measuring — the previous `button:visible`
    // fallback resolved on shell buttons (store menu toggle) before hydration,
    // so the measurement then raced the form and saw zero controls.
    await page
      .locator("input:visible, select:visible, textarea:visible")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await expectNoControlBelow16px(page, "/store/quote");
  });

  test("contact form controls render at 16px or larger", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("domcontentloaded");
    await expectNoControlBelow16px(page, "/contact");
  });

  test("emits the brand theme-color meta tag (MOB-P3-004)", async ({ page }) => {
    await page.goto("/store");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#059669");
  });

  test("serves an installable manifest and real icon files (MOB-P3-001, MOB-P3-005)", async ({
    page,
    request,
  }) => {
    await page.goto("/store");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      /manifest\.webmanifest/,
    );

    const manifestResponse = await request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const { icons = [] } = (await manifestResponse.json()) as {
      icons?: Array<{ src: string; sizes?: string; type?: string; purpose?: string }>;
    };
    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
          type: "image/png",
        }),
        expect.objectContaining({
          src: "/icons/icon-512-maskable.png",
          purpose: "maskable",
        }),
      ]),
    );

    // The .ico must be real ICO bytes (it used to be an SVG copy) and iOS
    // needs the 180x180 apple-touch icon.
    const ico = await request.get("/favicon.ico");
    expect(ico.ok()).toBe(true);
    expect(Buffer.from(await ico.body()).subarray(0, 4).toString("hex")).toBe("00000100");

    const apple = await request.get("/apple-touch-icon.png");
    expect(apple.ok()).toBe(true);
    expect((await apple.body()).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  test("notification panel stays inside the viewport (MOB-P3-003)", async ({ page }) => {
    await gotoApp(page, "/portal/dashboard");

    const bell = page.getByRole("button", { name: /^Notifications/ });
    await expect(bell).toBeVisible({ timeout: 20_000 });
    await bell.click();

    const panel = page.getByTestId("notification-panel");
    await expect(panel).toBeVisible();

    const viewport = page.viewportSize();
    const box = await panel.boundingBox();
    expect(box, "notification panel has no bounding box").not.toBeNull();
    if (box && viewport) {
      expect(box.x, "panel clips past the left viewport edge").toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, "panel clips past the right viewport edge").toBeLessThanOrEqual(
        viewport.width + 1,
      );
    }
  });

  test("icon-only controls meet the 44px touch-target guidance (MOB-P3-002)", async ({ page }) => {
    await page.goto("/store");
    await expectMinTouchTarget(
      page.getByRole("button", { name: "Toggle navigation menu" }),
      "marketing hamburger",
    );

    await page.getByRole("button", { name: "Browse categories" }).click();
    await expectMinTouchTarget(page.getByRole("button", { name: "Close menu" }), "store drawer close");
    await page.getByRole("button", { name: "Close menu" }).click();

    await gotoApp(page, "/portal/dashboard");
    await expectMinTouchTarget(
      page.getByRole("button", { name: /^Notifications/ }),
      "notification bell",
    );

    await page.getByRole("button", { name: "Open portal navigation" }).click();
    await expectMinTouchTarget(
      page.getByRole("button", { name: "Close menu" }),
      "portal drawer close",
    );
    await page.keyboard.press("Escape");
  });

  test("service worker registers and never caches API responses", async ({ page }) => {
    await gotoApp(page, "/portal/dashboard");

    const registrations = await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      return (await navigator.serviceWorker.getRegistrations()).map((r) => r.scope);
    });
    expect(registrations.length, "no service worker registration").toBeGreaterThan(0);
    // Reload once the worker is active so the page is controlled even if the
    // engine has not applied clients.claim() to the first load.
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    // A same-origin GET returning 200 is exactly the shape the previous
    // catch-all worker cached; the new worker must bypass `/api/` entirely.
    const probeStatus = await page.evaluate(async () => {
      const response = await fetch("/api/v1/public/init", { cache: "no-store" });
      return response.status;
    });
    expect(probeStatus).toBe(200);

    const cachedApiPaths = await page.evaluate(async () => {
      const paths: string[] = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
          paths.push(new URL(request.url).pathname);
        }
      }
      return paths.filter((path) => path.startsWith("/api/"));
    });
    expect(cachedApiPaths, "API responses must never be cached").toEqual([]);
  });

  test("offline navigation serves the precached offline page", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "setOffline is exercised on Chromium only here");

    await page.goto("/store");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    try {
      await page.goto("/store");
      await expect(page.getByRole("heading", { name: /offline/i })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test("create-promotion dialog fits and scrolls within the viewport", async ({ page }) => {
    await gotoApp(page, "/admin/store/promotions");

    const openButton = page.getByRole("button", { name: /create promotion/i });
    await expect(openButton).toBeVisible({ timeout: 20_000 });
    await openButton.click();

    const dialog = page.getByRole("dialog", { name: /create promotion/i });
    await expect(dialog).toBeVisible();

    const viewport = page.viewportSize();
    const box = await dialog.boundingBox();
    expect(box, "dialog has no bounding box").not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThanOrEqual(viewport.height * 0.9 + 1);
      expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    const submit = dialog.getByRole("button", { name: /^create$/i });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
  });

  test("create-category dialog fits and scrolls within the viewport", async ({ page }) => {
    await gotoApp(page, "/admin/store/categories");

    const openButton = page.getByRole("button", { name: /create category/i });
    await expect(openButton).toBeVisible({ timeout: 20_000 });
    await openButton.click();

    const dialog = page.getByRole("dialog", { name: /create category/i });
    await expect(dialog).toBeVisible();

    const viewport = page.viewportSize();
    const box = await dialog.boundingBox();
    expect(box, "dialog has no bounding box").not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThanOrEqual(viewport.height * 0.9 + 1);
      expect(box.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    const submit = dialog.getByRole("button", { name: /^create$/i });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
  });
});
