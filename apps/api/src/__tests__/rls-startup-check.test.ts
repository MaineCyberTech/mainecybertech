import { jest } from "@jest/globals";

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { assertRlsStartupConfig, parseAllowList } from "../lib/rls-startup-check";
import { logger } from "../lib/logger";
import type { Env } from "../config/env";

const mockedLogger = logger as unknown as {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
};

type EnvShape = Pick<Env, "NODE_ENV" | "RLS_READS_ENABLED" | "RLS_WRITES_ENABLED">;

function makeEnv(overrides: Partial<EnvShape> = {}): EnvShape {
  return {
    NODE_ENV: "production",
    RLS_READS_ENABLED: "satisfaction-pulse",
    RLS_WRITES_ENABLED: "satisfaction-pulse",
    ...overrides,
  };
}

describe("ARCH-P2-002 RLS startup guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("parses comma-separated allow-lists, trimming and dropping empty entries", () => {
    expect(parseAllowList(" a, b ,,c ")).toEqual(["a", "b", "c"]);
    expect(parseAllowList(undefined)).toEqual([]);
    expect(parseAllowList("   ,  ")).toEqual([]);
  });

  it("does not throw in non-production even when the allow-lists are empty", () => {
    expect(() =>
      assertRlsStartupConfig(
        makeEnv({ NODE_ENV: "development", RLS_READS_ENABLED: "", RLS_WRITES_ENABLED: "" }),
      ),
    ).not.toThrow();
  });

  it("fails closed in production when the read allow-list is empty", () => {
    expect(() => assertRlsStartupConfig(makeEnv({ RLS_READS_ENABLED: "" }))).toThrow(
      /RLS_READS_ENABLED is empty in production/,
    );
  });

  it("treats a whitespace-only read allow-list as empty in production", () => {
    expect(() => assertRlsStartupConfig(makeEnv({ RLS_READS_ENABLED: "  , " }))).toThrow(
      /RLS_READS_ENABLED is empty in production/,
    );
  });

  it("boots but logs an error when only the write allow-list is empty in production", () => {
    expect(() =>
      assertRlsStartupConfig(makeEnv({ RLS_WRITES_ENABLED: "" })),
    ).not.toThrow();
    expect(mockedLogger.error).toHaveBeenCalledTimes(1);
  });

  it("boots cleanly when both allow-lists are populated in production", () => {
    expect(() => assertRlsStartupConfig(makeEnv())).not.toThrow();
    expect(mockedLogger.error).not.toHaveBeenCalled();
  });
});
