"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { ApiError } from "@mct/sdk";
import { getApiClient } from "@/lib/api";
import { getCookieOptions } from "@/lib/cookie-domain";

const SESSION_COOKIE = "mct_session";
const SECURITY_PATH = "/portal/profile/security";

const MFA_REQUIRED_MESSAGE =
  "Second factor required. Verify your authenticator app, then try again.";

export type MfaFactorView = {
  id: string;
  friendlyName: string | null;
  status: string;
};

export type MfaRecoveryStatusView = {
  remaining: number;
  total: number;
  lastGeneratedAt: string | null;
};

export type MfaSessionUser = { id: string; email: string | null };

export type MfaActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: "MFA_REQUIRED" };

function toErrorResult(error: unknown): { error: string; code?: "MFA_REQUIRED" } {
  if (error instanceof ApiError && error.code === "MFA_REQUIRED") {
    return { error: MFA_REQUIRED_MESSAGE, code: "MFA_REQUIRED" };
  }
  return { error: error instanceof Error ? error.message : "Something went wrong" };
}

export async function listMfaFactorsAction(): Promise<MfaActionResult<MfaFactorView[]>> {
  try {
    const result = await getApiClient().auth.mfaFactors();
    return {
      ok: true,
      data: (result.totp ?? []).map((f) => ({
        id: f.id,
        friendlyName: f.friendlyName,
        status: f.status,
      })),
    };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}

export async function enrollMfaAction(
  friendlyName: string,
): Promise<MfaActionResult<{ factorId: string; qrCode: string; secret: string }>> {
  try {
    const result = await getApiClient().auth.mfaEnroll(friendlyName.trim() || undefined);
    return {
      ok: true,
      data: { factorId: result.factorId, qrCode: result.qrCode, secret: result.secret },
    };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}

export async function verifyMfaAction(
  factorId: string,
  code: string,
): Promise<MfaActionResult<{ user: MfaSessionUser }>> {
  try {
    const api = getApiClient();
    const challenge = await api.auth.mfaChallenge(factorId);
    const result = await api.auth.mfaVerify(factorId, challenge.challengeId, code.trim());

    // A successful verify upgrades the session to aal2. Store the fresh
    // token so the session reflects the verified state (MFA is opt-in for
    // now; these endpoints do not yet gate API access).
    const cookieStore = await cookies();
    const headersList = await headers();
    const host = headersList.get("host") || "";
    cookieStore.set(SESSION_COOKIE, result.accessToken, getCookieOptions(host));

    revalidatePath(SECURITY_PATH);
    return { ok: true, data: { user: result.user } };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}

/**
 * Complete an inline second-factor step-up (challenge + verify) and persist
 * the fresh aal2 token. `verifyMfaAction` already owns the challenge/verify
 * and cookie flow, so this action reuses it and returns the verified user.
 */
export async function stepUpMfaAction(
  factorId: string,
  code: string,
): Promise<MfaActionResult<{ user: MfaSessionUser }>> {
  return verifyMfaAction(factorId, code);
}

export async function removeMfaAction(factorId: string): Promise<MfaActionResult> {
  try {
    await getApiClient().auth.mfaUnenroll(factorId);
    revalidatePath(SECURITY_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}

export async function generateRecoveryCodesAction(): Promise<
  MfaActionResult<{ codes: string[]; remaining: number }>
> {
  try {
    const result = await getApiClient().auth.mfaGenerateRecoveryCodes();
    revalidatePath(SECURITY_PATH);
    return { ok: true, data: { codes: result.codes, remaining: result.remaining } };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}

export async function revokeRecoveryCodesAction(): Promise<MfaActionResult> {
  try {
    await getApiClient().auth.mfaRevokeRecoveryCodes();
    revalidatePath(SECURITY_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, ...toErrorResult(error) };
  }
}
