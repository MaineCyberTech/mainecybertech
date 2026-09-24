import sitemap from "@/app/sitemap";
import { getBlogPost } from "@/lib/seo/blog-posts";

describe("sitemap", () => {
  it("only lists the homepage and blog (matching the crawl policy)", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://www.mainecybertech.com");
    expect(urls).toContain("https://www.mainecybertech.com/blog");
    expect(urls.some((url) => url.includes("/blog/"))).toBe(true);

    for (const disallowed of ["/store", "/services", "/case-studies", "/resources", "/contact"]) {
      expect(urls.some((url) => url.includes(disallowed))).toBe(false);
    }
  });

  it("only lists blog posts that actually render (no dead slugs)", () => {
    const slugs = sitemap()
      .map((entry) => entry.url)
      .filter((url) => url.includes("/blog/"))
      .map((url) => url.split("/blog/")[1]);

    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      if (!getBlogPost(slug)) {
        throw new Error(`sitemap lists /blog/${slug} but no post exists`);
      }
    }
  });
});
