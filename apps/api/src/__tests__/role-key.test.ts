import { roleKeyOf } from "../lib/roles";

describe("roleKeyOf", () => {
  it("reads key from an object embed", () => {
    expect(roleKeyOf({ id: "r1", key: "admin" })).toBe("admin");
  });

  it("reads key from a single-element array embed", () => {
    expect(roleKeyOf([{ id: "r1", key: "engineer" }])).toBe("engineer");
  });

  it("returns undefined for null/undefined/empty", () => {
    expect(roleKeyOf(null)).toBeUndefined();
    expect(roleKeyOf(undefined)).toBeUndefined();
    expect(roleKeyOf([])).toBeUndefined();
  });
});
