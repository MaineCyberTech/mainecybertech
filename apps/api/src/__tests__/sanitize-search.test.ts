import { sanitizeSearchTerm } from "../lib/search";

describe("sanitizeSearchTerm", () => {
  it("returns a plain term unchanged", () => {
    expect(sanitizeSearchTerm("acme")).toBe("acme");
  });

  it("strips PostgREST condition separators", () => {
    expect(sanitizeSearchTerm("a,organization_id.neq.x")).toBe("a organization_id.neq.x");
  });

  it("strips grouping and quotes", () => {
    expect(sanitizeSearchTerm('a)(b)"c')).toBe("a b c");
  });

  it("strips SQL LIKE wildcards but keeps underscores", () => {
    expect(sanitizeSearchTerm("100%")).toBe("100");
    expect(sanitizeSearchTerm("user_id")).toBe("user_id");
  });

  it("handles arrays and undefined", () => {
    expect(sanitizeSearchTerm(undefined)).toBe("");
    expect(sanitizeSearchTerm(["a", "b"])).toBe("a b");
  });
});
