import { toJson, asInsert, asUpdate } from "../lib/db-types";

describe("db-types", () => {
  it("toJson returns the same reference/value", () => {
    const value = { a: 1, b: [true, null, "x"] };
    expect(toJson(value)).toBe(value);
  });

  it("toJson passes primitives through", () => {
    expect(toJson("x")).toBe("x");
    expect(toJson(3)).toBe(3);
    expect(toJson(null)).toBeNull();
  });

  it("asInsert returns the same object", () => {
    const payload = { name: "x" };
    expect(asInsert<"roles">(payload)).toBe(payload);
  });

  it("asUpdate returns the same object", () => {
    const payload = { name: "y" };
    expect(asUpdate<"roles">(payload)).toBe(payload);
  });
});
