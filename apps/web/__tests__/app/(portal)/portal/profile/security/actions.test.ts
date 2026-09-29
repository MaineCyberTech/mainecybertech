import { jest } from "@jest/globals";

const mockMfaFactors = jest.fn();
const mockMfaEnroll = jest.fn();
const mockMfaChallenge = jest.fn();
const mockMfaVerify = jest.fn();
const mockMfaUnenroll = jest.fn();
const mockMfaGenerateRecoveryCodes = jest.fn();
const mockMfaRevokeRecoveryCodes = jest.fn();
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
      mfaGenerateRecoveryCodes: mockMfaGenerateRecoveryCodes,
      mfaRevokeRecoveryCodes: mockMfaRevokeRecoveryCodes,
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

import { ApiError } from "@mct/sdk";
import {
  listMfaFactorsAction,
  enrollMfaAction,
  verifyMfaAction,
  stepUpMfaAction,
  removeMfaAction,
  generateRecoveryCodesAction,
  revokeRecoveryCodesAction,
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
    mockMfaVerify.mockResolvedValue({
      accessToken: "aal2-token",
      user: { id: "u1", email: "user@example.com" },
    });

    const result = await verifyMfaAction("f1", " 123456 ");

    expect(mockMfaChallenge).toHaveBeenCalledWith("f1");
    expect(mockMfaVerify).toHaveBeenCalledWith("f1", "c1", "123456");
    expect(mockCookieSet).toHaveBeenCalledWith("mct_session", "aal2-token", { httpOnly: true });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
    expect(result).toEqual({
      ok: true,
      data: { user: { id: "u1", email: "user@example.com" } },
    });
  });

  it("surfaces a failed verification", async () => {
    mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 1 });
    mockMfaVerify.mockRejectedValue(new Error("invalid code"));
    const result = await verifyMfaAction("f1", "000000");
    expect(result).toEqual({ ok: false, error: "invalid code" });
  });

  it("steps up via challenge+verify and stores the aal2 token", async () => {
    mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 1 });
    mockMfaVerify.mockResolvedValue({
      accessToken: "aal2-token",
      user: { id: "u1", email: "user@example.com" },
    });

    const result = await stepUpMfaAction("f1", "123456");

    expect(mockMfaChallenge).toHaveBeenCalledWith("f1");
    expect(mockMfaVerify).toHaveBeenCalledWith("f1", "c1", "123456");
    expect(mockCookieSet).toHaveBeenCalledWith("mct_session", "aal2-token", { httpOnly: true });
    expect(result).toEqual({
      ok: true,
      data: { user: { id: "u1", email: "user@example.com" } },
    });
  });

  it("returns the step-up error and leaves the session cookie untouched", async () => {
    mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 1 });
    mockMfaVerify.mockRejectedValue(new Error("Invalid code"));

    const result = await stepUpMfaAction("f1", "000000");

    expect(result).toEqual({ ok: false, error: "Invalid code" });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("removes a factor and revalidates", async () => {
    mockMfaUnenroll.mockResolvedValue({ ok: true });
    const result = await removeMfaAction("f1");
    expect(mockMfaUnenroll).toHaveBeenCalledWith("f1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
    expect(result).toEqual({ ok: true });
  });

  it("generates recovery codes and revalidates", async () => {
    mockMfaGenerateRecoveryCodes.mockResolvedValue({
      codes: ["ABCDE-FGHIJ", "KLMNP-QRSTU"],
      remaining: 2,
    });

    const result = await generateRecoveryCodesAction();

    expect(result).toEqual({
      ok: true,
      data: { codes: ["ABCDE-FGHIJ", "KLMNP-QRSTU"], remaining: 2 },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
  });

  it("translates an MFA_REQUIRED failure into a step-up message", async () => {
    mockMfaGenerateRecoveryCodes.mockRejectedValue(
      new ApiError("MFA_REQUIRED", "Second factor required", 403),
    );

    const result = await generateRecoveryCodesAction();

    expect(result).toEqual({
      ok: false,
      error: "Second factor required. Verify your authenticator app, then try again.",
      code: "MFA_REQUIRED",
    });
  });

  it("surfaces a generation error without a code", async () => {
    mockMfaGenerateRecoveryCodes.mockRejectedValue(new Error("Enroll an authenticator app first"));

    const result = await generateRecoveryCodesAction();

    expect(result).toEqual({ ok: false, error: "Enroll an authenticator app first" });
  });

  it("revokes recovery codes and revalidates", async () => {
    mockMfaRevokeRecoveryCodes.mockResolvedValue({ ok: true });

    const result = await revokeRecoveryCodesAction();

    expect(mockMfaRevokeRecoveryCodes).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/profile/security");
    expect(result).toEqual({ ok: true });
  });

  it("translates an MFA_REQUIRED failure on revoke", async () => {
    mockMfaRevokeRecoveryCodes.mockRejectedValue(
      new ApiError("MFA_REQUIRED", "Second factor required", 403),
    );

    const result = await revokeRecoveryCodesAction();

    expect(result).toEqual({
      ok: false,
      error: "Second factor required. Verify your authenticator app, then try again.",
      code: "MFA_REQUIRED",
    });
  });
});
