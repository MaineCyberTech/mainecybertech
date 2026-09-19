import { queryString, queryInt, queryStringArray } from "../lib/query";

describe("queryString", () => {
  it("returns a string unchanged", () => {
    expect(queryString("abc")).toBe("abc");
  });

  it("returns the first string from an array (repeated params)", () => {
    expect(queryString(["a", "b"])).toBe("a");
  });

  it("skips non-string array entries", () => {
    expect(queryString([{ a: 1 }, "b"])).toBe("b");
  });

  it("returns undefined for objects and undefined", () => {
    expect(queryString({ a: 1 })).toBeUndefined();
    expect(queryString(undefined)).toBeUndefined();
    expect(queryString(42)).toBeUndefined();
  });
});

describe("queryInt", () => {
  it("parses an integer string", () => {
    expect(queryInt("42", 1)).toBe(42);
  });

  it("uses the fallback for absent, empty, or non-numeric values", () => {
    expect(queryInt(undefined, 1)).toBe(1);
    expect(queryInt("", 25)).toBe(25);
    expect(queryInt("abc", 25)).toBe(25);
  });

  it("parses the first value of a repeated param", () => {
    expect(queryInt(["7", "9"], 1)).toBe(7);
  });

  it("returns undefined without a fallback when absent", () => {
    expect(queryInt(undefined)).toBeUndefined();
  });
});

describe("queryStringArray", () => {
  it("wraps a single string", () => {
    expect(queryStringArray("a")).toEqual(["a"]);
  });

  it("filters non-string entries from an array", () => {
    expect(queryStringArray(["a", 1, "b"])).toEqual(["a", "b"]);
  });

  it("returns an empty array otherwise", () => {
    expect(queryStringArray(undefined)).toEqual([]);
    expect(queryStringArray({ a: 1 })).toEqual([]);
  });
});
