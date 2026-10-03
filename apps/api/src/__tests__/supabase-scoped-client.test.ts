jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    JWT_SECRET: "test-jwt-secret",
  }),
}));

import { getSupabaseAdmin, getSupabaseUser, getScopedClient } from "../services/supabase";

describe("getScopedClient (RLS gating enabler)", () => {
  const JWT = "test-jwt";
  const REQ = { userJwt: JWT } as unknown as import("express").Request;

  afterEach(() => {
    delete process.env.RLS_READS_ENABLED;
    delete process.env.RLS_WRITES_ENABLED;
  });

  it("returns the admin client when no module is enabled", () => {
    expect(getScopedClient(REQ, "knowledge-base", "read")).toBe(getSupabaseAdmin());
    expect(getScopedClient(REQ, "knowledge-base", "write")).toBe(getSupabaseAdmin());
  });

  it("switches to the user-scoped client for READS when RLS_READS_ENABLED includes the module", () => {
    process.env.RLS_READS_ENABLED = "knowledge-base";
    const scoped = getScopedClient(REQ, "knowledge-base", "read");
    expect(scoped).not.toBe(getSupabaseAdmin());
    expect(scoped).toBe(getSupabaseUser(REQ, JWT));
  });

  it("does NOT switch for WRITES when only RLS_READS_ENABLED is set", () => {
    process.env.RLS_READS_ENABLED = "knowledge-base";
    expect(getScopedClient(REQ, "knowledge-base", "write")).toBe(getSupabaseAdmin());
  });

  it("switches to the user-scoped client for WRITES when RLS_WRITES_ENABLED includes the module", () => {
    process.env.RLS_WRITES_ENABLED = "knowledge-base";
    const scoped = getScopedClient(REQ, "knowledge-base", "write");
    expect(scoped).not.toBe(getSupabaseAdmin());
    expect(scoped).toBe(getSupabaseUser(REQ, JWT));
  });

  it("falls back to admin when req.userJwt is missing (public routes)", () => {
    process.env.RLS_READS_ENABLED = "knowledge-base";
    const anonReq = {} as unknown as import("express").Request;
    expect(getScopedClient(anonReq, "knowledge-base", "read")).toBe(getSupabaseAdmin());
  });

  it("is module-specific: other modules stay on admin", () => {
    process.env.RLS_READS_ENABLED = "sla";
    expect(getScopedClient(REQ, "tickets", "read")).toBe(getSupabaseAdmin());
    expect(getScopedClient(REQ, "sla", "read")).toBe(getSupabaseUser(REQ, JWT));
  });
});
