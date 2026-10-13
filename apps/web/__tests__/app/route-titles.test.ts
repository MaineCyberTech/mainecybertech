import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const APP_DIR = join(__dirname, "..", "..", "app");

function findPages(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return findPages(full);
    return entry === "page.tsx" ? [full] : [];
  });
}

// A page gets a page-specific title from a static metadata export, a
// generateMetadata export, or a <title> element (client pages).
const TITLE_MECHANISMS = [
  /export\s+const\s+metadata\b/,
  /export\s+(?:async\s+)?function\s+generateMetadata\b/,
  /<title[\s>]/,
];

describe("route titles", () => {
  const pages = findPages(APP_DIR);

  it("walks the App Router page tree", () => {
    expect(pages.length).toBeGreaterThan(300);
  });

  it("gives every page a page-specific title (WCAG 2.4.2)", () => {
    const missing = pages.filter(
      (file) => !TITLE_MECHANISMS.some((pattern) => pattern.test(readFileSync(file, "utf8"))),
    );
    expect(missing.map((file) => relative(APP_DIR, file))).toEqual([]);
  });
});
