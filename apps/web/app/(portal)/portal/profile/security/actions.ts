"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { getApiClient } from "@/lib/api";
import { getCookieOptions } from "@/lib/cookie-domain";

const SESSION_COOKIE = "mct_session";
const SECURITY_PATH = "/portal/profile/security";

export type MfaFactorView = {
  id: string;
  friendlyName: string | null;
  status: string;
};

export type MfaActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
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
    return { ok: false, error: toMessage(error) };
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
    return { ok: false, error: toMessage(error) };
  }
}

export async function verifyMfaAction(factorId: string, code: string): Promise<MfaActionResult> {
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
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}

export async function removeMfaAction(factorId: string): Promise<MfaActionResult> {
  try {
    await getApiClient().auth.mfaUnenroll(factorId);
    revalidatePath(SECURITY_PATH);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }
}
