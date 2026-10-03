import { sanitizeSearchTerm } from "../lib/search";

describe("sanitizeSearchTerm", () => {
  it("returns a plain term unchanged", () => {
    expect(sanitizeSearchTerm("acme")).toBe("acme");
  });

  it("strips PostgREST condition separators and the operator separator", () => {
    // `.` is PostgREST's column/operator/value separator inside `.or()`, so a
    // dotted term must not survive verbatim (SEARCH-P1-001).
    expect(sanitizeSearchTerm("a,organization_id.neq.x")).toBe("a organization_id neq x");
    expect(sanitizeSearchTerm("name.ilike.x")).toBe("name ilike x");
  });

  it("strips grouping and quotes", () => {
    expect(sanitizeSearchTerm('a)(b)"c')).toBe("a b c");
  });

  it("strips SQL LIKE wildcards but keeps underscores", () => {
    expect(sanitizeSearchTerm("100%")).toBe("100");
    expect(sanitizeSearchTerm("user_id")).toBe("user_id");
  });

  it("strips PostgREST full-text alias", () => {
    expect(sanitizeSearchTerm("a*b")).toBe("a b");
    expect(sanitizeSearchTerm("*")).toBe("");
  });

  // Regression: SEARCH-P1-001 injection vectors. Each of these, if passed
  // through into `.or("col.ilike.<term>")`, could reshape the PostgREST filter
  // grammar. None may retain an unescaped `.` or `*`.
  it("neutralizes PostgREST `.or()` filter-injection attempts", () => {
    const injections = [
      "a.eq.b",
      "a.and.x",
      "name.ilike.%25,organization_id.neq.00000000-0000-0000-0000-000000000000",
      "x.or(organization_id.neq.1)",
      "a.eq.b,a.eq.c",
      "*",
      "a*",
    ];
    for (const injection of injections) {
      const cleaned = sanitizeSearchTerm(injection);
      expect(cleaned).not.toContain(".");
      expect(cleaned).not.toContain("*");
      expect(cleaned).not.toContain(",");
      expect(cleaned).not.toContain("(");
      expect(cleaned).not.toContain(")");
      expect(cleaned).not.toMatch(/["\\%]/);
    }
    expect(sanitizeSearchTerm("a.eq.b")).toBe("a eq b");
    expect(sanitizeSearchTerm("a*")).toBe("a");
  });

  it("flattens a literal dot (documented tradeoff: dots are not searchable)", () => {
    expect(sanitizeSearchTerm("example.com")).toBe("example com");
    expect(sanitizeSearchTerm("10.0.0.1")).toBe("10 0 0 1");
    expect(sanitizeSearchTerm("first.last")).toBe("first last");
  });

  it("caps the term length at 100 characters", () => {
    const long = "a".repeat(250);
    expect(sanitizeSearchTerm(long)).toHaveLength(100);
  });

  it("handles arrays and undefined", () => {
    expect(sanitizeSearchTerm(undefined)).toBe("");
    expect(sanitizeSearchTerm(["a", "b"])).toBe("a b");
  });
});
