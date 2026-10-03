import { jest } from "@jest/globals";
import { assertResourceOrg } from "../lib/tenant";
import { logImpersonation } from "../services/impersonation";
import { AppError } from "../types";

jest.mock("../services/impersonation", () => ({
  logImpersonation: jest.fn(),
}));

function makeReq(orgScope?: {
  orgId: string | null;
  explicit: boolean;
  platformAdmin: boolean;
  impersonation: boolean;
}) {
  return {
    authUser: { userId: "user-1", email: "u@e.com" },
    orgScope,
  } as any;
}

describe("assertResourceOrg", () => {
  beforeEach(() => {
    (logImpersonation as jest.Mock).mockClear();
  });

  it("allows when the resource belongs to the caller's org", () => {
    const req = makeReq({
      orgId: "org-1",
      explicit: true,
      platformAdmin: false,
      impersonation: false,
    });
    expect(() => assertResourceOrg(req, "org-1")).not.toThrow();
  });

  it("throws NOT_FOUND (404) when the resource is in another org", () => {
    const req = makeReq({
      orgId: "org-1",
      explicit: true,
      platformAdmin: false,
      impersonation: false,
    });
    let caught: unknown;
    try {
      assertResourceOrg(req, "org-2");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AppError);
    expect((caught as AppError).status).toBe(404);
    expect((caught as AppError).code).toBe("NOT_FOUND");
  });

  it("allows platform admins acting without an explicit org (org-agnostic)", () => {
    const req = makeReq({
      orgId: null,
      explicit: false,
      platformAdmin: true,
      impersonation: false,
    });
    expect(() => assertResourceOrg(req, "org-9")).not.toThrow();
    expect(logImpersonation).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "user-1",
        actorRoleKey: "platform-admin",
        organizationId: "org-9",
        reason: "cross_tenant_resource_access",
      }),
    );
  });

  it("still scopes a platform admin that has explicitly selected an org", () => {
    const req = makeReq({
      orgId: "org-1",
      explicit: true,
      platformAdmin: true,
      impersonation: true,
    });
    expect(() => assertResourceOrg(req, "org-1")).not.toThrow();
    let caught: unknown;
    try {
      assertResourceOrg(req, "org-2");
    } catch (e) {
      caught = e;
    }
    expect((caught as AppError).status).toBe(404);
  });

  it("fails safe to 404 when no scope was resolved", () => {
    const req = makeReq(undefined);
    let caught: unknown;
    try {
      assertResourceOrg(req, "org-1");
    } catch (e) {
      caught = e;
    }
    expect((caught as AppError).status).toBe(404);
  });
});
