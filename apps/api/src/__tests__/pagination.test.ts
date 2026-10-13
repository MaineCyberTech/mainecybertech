import { listCountMode, parsePagination } from "../lib/pagination";

// PERF-P3-002: paginated lists default to an estimated count (no COUNT(*)
// scan) and only run an exact count when the caller opts in.
describe("listCountMode", () => {
  it("defaults to estimated", () => {
    expect(listCountMode({})).toBe("estimated");
    expect(listCountMode({ page: "1", limit: "25" })).toBe("estimated");
  });

  it("returns exact when withTotal is truthy", () => {
    expect(listCountMode({ withTotal: "1" })).toBe("exact");
    expect(listCountMode({ withTotal: "true" })).toBe("exact");
    expect(listCountMode({ exactTotal: "1" })).toBe("exact");
  });

  it("ignores falsy opt-in values", () => {
    expect(listCountMode({ withTotal: "0" })).toBe("estimated");
    expect(listCountMode({ withTotal: "false" })).toBe("estimated");
  });
});

describe("parsePagination", () => {
  it("applies defaults and clamps the limit", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, offset: 0 });
    expect(parsePagination({ page: "3", limit: "500" })).toEqual({
      page: 3,
      limit: 100,
      offset: 200,
    });
    expect(parsePagination({ page: "0", limit: "-5" }, { defaultLimit: 25, maxLimit: 50 })).toEqual({
      page: 1,
      limit: 25,
      offset: 0,
    });
  });
});
