import { jest } from "@jest/globals";
import { startHealthServer } from "../main";

describe("worker health server", () => {
  it("startHealthServer is a function", () => {
    expect(typeof startHealthServer).toBe("function");
  });
});
