import { jest } from "@jest/globals";

jest.mock("../config/env", () => ({
  getEnv: jest.fn(() => ({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  })),
  resolveRedisUrl: (u: string) => u,
}));

const createClientMock = jest.fn((_url: string, key: string) => ({
  __key: key,
  from: jest.fn(),
  auth: {},
}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: (url: string, key: string) => createClientMock(url, key),
}));

import { getScopedClient } from "../services/supabase";

type Req = { userJwt?: string; headers?: Record<string, string> };

function makeReq(userJwt?: string): Req {
  return { userJwt };
}

describe("getScopedClient RLS allow-list", () => {
  const originalReads = process.env.RLS_READS_ENABLED;
  const originalWrites = process.env.RLS_WRITES_ENABLED;

  afterEach(() => {
    process.env.RLS_READS_ENABLED = originalReads;
    process.env.RLS_WRITES_ENABLED = originalWrites;
    createClientMock.mockClear();
  });

  it("returns the service-role client when the module is not allow-listed", () => {
    process.env.RLS_READS_ENABLED = "other-module";
    const client = getScopedClient(makeReq("jwt-123") as never, "satisfaction-pulse", "read");
    expect((client as unknown as { __key: string }).__key).toBe("service-role-key");
  });

  it("returns a user-scoped (RLS) client when the read module is allow-listed and a JWT is present", () => {
    process.env.RLS_READS_ENABLED = "satisfaction-pulse,other";
    const client = getScopedClient(makeReq("jwt-123") as never, "satisfaction-pulse", "read");
    expect((client as unknown as { __key: string }).__key).toBe("anon-key");
  });

  it("falls back to the service-role client when allow-listed but no JWT is present", () => {
    process.env.RLS_READS_ENABLED = "satisfaction-pulse";
    const client = getScopedClient(makeReq(undefined) as never, "satisfaction-pulse", "read");
    expect((client as unknown as { __key: string }).__key).toBe("service-role-key");
  });

  it("gates writes on RLS_WRITES_ENABLED independently of reads", () => {
    process.env.RLS_READS_ENABLED = "satisfaction-pulse";
    process.env.RLS_WRITES_ENABLED = "";
    const writeClient = getScopedClient(makeReq("jwt-123") as never, "satisfaction-pulse", "write");
    expect((writeClient as unknown as { __key: string }).__key).toBe("service-role-key");

    process.env.RLS_WRITES_ENABLED = "satisfaction-pulse";
    const writeClient2 = getScopedClient(
      makeReq("jwt-123") as never,
      "satisfaction-pulse",
      "write",
    );
    expect((writeClient2 as unknown as { __key: string }).__key).toBe("anon-key");
  });
});
