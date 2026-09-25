import robots from "@/app/robots";

describe("robots", () => {
  it("limits crawling to the homepage and blog only", () => {
    const output = robots();
    const rules = Array.isArray(output.rules) ? output.rules : [output.rules];
    const rule = rules[0] as { allow?: string | string[]; disallow?: string | string[] };

    expect(rule.disallow).toBe("/");
    expect([rule.allow].flat()).toEqual(expect.arrayContaining(["/$", "/blog"]));
  });

  it("advertises the sitemap", () => {
    const output = robots();
    expect(output.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
