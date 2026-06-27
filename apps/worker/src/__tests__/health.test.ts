import { jest } from "@jest/globals";
import { startHealthServer } from "../health-server";

describe("worker health server", () => {
  it("startHealthServer is a function", () => {
    expect(typeof startHealthServer).toBe("function");
  });
});
