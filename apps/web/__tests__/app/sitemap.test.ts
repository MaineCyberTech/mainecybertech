import sitemap from "@/app/sitemap";

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
});
