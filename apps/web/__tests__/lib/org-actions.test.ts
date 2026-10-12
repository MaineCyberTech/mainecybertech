import { jest } from "@jest/globals";

const mockMine = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  memberships: { mine: mockMine },
});
const mockCookieSet = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ set: mockCookieSet }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

function membership(organizationId: string, status: string, roleKey: string) {
  return {
    id: `m-${organizationId}`,
    organization_id: organizationId,
    status,
    roles: { key: roleKey },
  };
}

describe("setActiveOrg server-side authorization (SEC-P3-011 / ADMIN-P3-002)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sets the cookie for an approved member", async () => {
    mockMine.mockResolvedValue([membership("org-a", "approved", "member")]);

    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("org-a");

    expect(result).toEqual({ ok: true });
    expect(mockCookieSet).toHaveBeenCalledWith("mct_active_org", "org-a", expect.any(Object));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an org the caller has no approved membership in", async () => {
    mockMine.mockResolvedValue([membership("org-a", "approved", "member")]);

    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("org-b");

    expect(result).toEqual({ ok: false, error: expect.stringContaining("access") });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects a pending or suspended membership", async () => {
    mockMine.mockResolvedValue([membership("org-b", "pending", "member")]);

    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("org-b");

    expect(result.ok).toBe(false);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("allows a platform admin to switch into a tenant they do not belong to", async () => {
    mockMine.mockResolvedValue([membership("org-a", "approved", "admin")]);

    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("org-other");

    expect(result).toEqual({ ok: true });
    expect(mockCookieSet).toHaveBeenCalledWith("mct_active_org", "org-other", expect.any(Object));
  });

  it("fails closed when the membership lookup fails", async () => {
    mockMine.mockRejectedValue(new Error("api unavailable"));

    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("org-a");

    expect(result.ok).toBe(false);
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects an empty organization id", async () => {
    const { setActiveOrg } = await import("@/lib/org-actions");
    const result = await setActiveOrg("");

    expect(result.ok).toBe(false);
    expect(mockGetApiClient).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
  });
});
