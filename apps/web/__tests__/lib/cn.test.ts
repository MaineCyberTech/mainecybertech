import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", true && "active", false && "inactive");
    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).not.toContain("inactive");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null);
    expect(result).toBe("base");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-4 py-2", "px-8");
    expect(result).toBe("py-2 px-8");
  });
});
