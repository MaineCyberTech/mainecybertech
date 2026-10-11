import { jest } from "@jest/globals";

/**
 * PRIV-P2-004 — audit-log PII redaction regression tests.
 *
 * The previous filter only looked at top-level key names containing
 * full_name/email/phone/password/token/secret, so person `name`/`title`/
 * `job_title` values and any nested PII were written to `audit_logs.metadata`
 * in plaintext for the full 365-day retention (and exported to org admins).
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent, redactAuditMetadata } from "../services/audit";

function mockInsert() {
  const insert = jest.fn().mockResolvedValue({ error: null });
  const from = jest.fn(() => ({ insert }));
  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });
  return { insert, from };
}

describe("audit metadata redaction (PRIV-P2-004)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redacts person names and job titles at the top level", async () => {
    const { insert } = mockInsert();

    await logAuditEvent({
      action: "profile.update",
      entityType: "profile",
      entityId: "user-1",
      metadata: {
        name: "Jane Doe",
        title: "CISO",
        job_title: "Security Lead",
        status: "approved",
      },
    });

    const payload = insert.mock.calls[0][0] as { metadata: Record<string, unknown> };
    expect(payload.metadata).toEqual({
      name: "[REDACTED]",
      title: "[REDACTED]",
      job_title: "[REDACTED]",
      status: "approved",
    });
  });

  it("redacts nested and array-nested PII", async () => {
    const { insert } = mockInsert();

    await logAuditEvent({
      action: "public.lead.submit",
      entityType: "public_interaction",
      metadata: {
        lead: { name: "Jane Doe", email: "jane@example.com", company: "Acme" },
        updates: [{ title: "CISO", roleId: "r1" }],
      },
    });

    const payload = insert.mock.calls[0][0] as { metadata: Record<string, unknown> };
    expect(payload.metadata).toEqual({
      lead: { name: "[REDACTED]", email: "[REDACTED]", company: "Acme" },
      updates: [{ title: "[REDACTED]", roleId: "r1" }],
    });
  });

  it("never lets raw PII reach the insert payload", async () => {
    const { insert } = mockInsert();

    await logAuditEvent({
      action: "user.invite",
      entityType: "user",
      metadata: {
        name: "Jane Doe",
        adminEmail: "admin@example.com",
        phone: "+1 207 555 0100",
        profile: { full_name: "Jane Doe", title: "CISO" },
      },
    });

    const serialized = JSON.stringify(insert.mock.calls[0][0]);
    expect(serialized).not.toContain("Jane Doe");
    expect(serialized).not.toContain("admin@example.com");
    expect(serialized).not.toContain("555 0100");
  });

  it("keeps non-PII keys and non-plain values", () => {
    const createdAt = new Date("2026-10-11T00:00:00.000Z");
    expect(
      redactAuditMetadata({ roleId: "r1", organizationId: "o1", createdAt }),
    ).toEqual({ roleId: "r1", organizationId: "o1", createdAt });
  });

  it("treats missing metadata as an empty object", async () => {
    const { insert } = mockInsert();

    await logAuditEvent({ action: "auth.signout", entityType: "session" });

    const payload = insert.mock.calls[0][0] as { metadata: unknown };
    expect(payload.metadata).toEqual({});
  });
});
