import { jest } from "@jest/globals";

const mockMfaFactors = jest.fn();
const mockMfaEnroll = jest.fn();
const mockMfaChallenge = jest.fn();
const mockMfaVerify = jest.fn();
const mockMfaUnenroll = jest.fn();
const mockCookieSet = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    auth: {
      mfaFactors: mockMfaFactors,
      mfaEnroll: mockMfaEnroll,
      mfaChallenge: mockMfaChallenge,
      mfaVerify: mockMfaVerify,
      mfaUnenroll: mockMfaUnenroll,
    },
  }),
}));

jest.mock("@/lib/cookie-domain", () => ({
  getCookieOptions: jest.fn(() => ({ httpOnly: true })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({ set: mockCookieSet }),
  headers: jest.fn().mockResolvedValue(new Headers({ host: "localhost:3000" })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import {
  listMfaFactorsAction,
  enrollMfaAction,
  verifyMfaAction,
  removeMfaAction,
} from "@/app/(portal)/portal/profile/security/actions";

describe("MFA security actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists factors mapped to the view shape", async () => {
    mockMfaFactors.mockResolvedValue({
      totp: [{ id: "f1", friendlyName: "Phone", status: "verified", createdAt: "x" }],
      all: [],
    });
    const result = await listMfaFactorsAction();
    expect(result).toEqual({
      ok: true,
      data: [{ id: "f1", friendlyName: "Phone", status: "verified" }],
    });
  });

  it("returns an error result when listing fails", async () => {
    mockMfaFactors.mockRejectedValue(new Error("boom"));
    const result = await listMfaFactorsAction();
    expect(result).toEqual({ ok: false, error: "boom" });
  });

  it("enrolls and returns the qr/secret", async () => {
    mockMfaEnroll.mockResolvedValue({ factorId: "f1", qrCode: "<svg/>", secret: "ABC" });
    const result = await enrollMfaAction("Phone");
    expect(mockMfaEnroll).toHaveBeenCalledWith("Phone");
    expect(result).toEqual({ ok: true, data: { factorId: "f1", qrCode: "<svg/>", secret: "ABC" } });
  });

  it("enrolls without a friendly name when blank", async () => {
    mockMfaEnroll.mockResolvedValue({ factorId: "f1", qrCode: "<svg/>", secret: "ABC" });
    await enrollMfaAction("   ");
    expect(mockMfaEnroll).toHaveBeenCalledWith(undefined);
  });

  it("challenges then verifies and refreshes the session cookie", async () => {
    mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 1 });
    mockMfaVerify.mockResolvedValue({ accessToken: "aal2-token", user: { id: "u1" } });

    const result = await verifyMfaAction("f1", " 123456 ");

    expect(mockMfaChallenge).toHaveBeenCalledWith("f1");
    expect(mockMfaVerify).toHaveBeenCalledWith("f1", "c1", "123456");
    expect(mockCookieSet).toHaveBeenCalledWith("mct_session", "aal2-token", { httpOnly: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
    expect(result).toEqual({ ok: true });
  });

  it("surfaces a failed verification", async () => {
    mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 1 });
    mockMfaVerify.mockRejectedValue(new Error("invalid code"));
    const result = await verifyMfaAction("f1", "000000");
    expect(result).toEqual({ ok: false, error: "invalid code" });
  });

  it("removes a factor and revalidates", async () => {
    mockMfaUnenroll.mockResolvedValue({ ok: true });
    const result = await removeMfaAction("f1");
    expect(mockMfaUnenroll).toHaveBeenCalledWith("f1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
    expect(result).toEqual({ ok: true });
  });
});
