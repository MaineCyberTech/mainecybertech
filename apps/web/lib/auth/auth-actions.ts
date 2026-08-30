"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { MCTClient, ApiError } from "@mct/sdk";
import { getCookieOptions } from "@/lib/cookie-domain";
import { getClientEnv } from "@/lib/env";
import { isPlatformAdminKey } from "@/lib/roles";

const SESSION_COOKIE = "mct_session";

function unauthClient() {
  return MCTClient.create({
    baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
  });
}

export async function loginAction(email: string, password: string) {
  let accessToken: string;
  try {
    const result = await unauthClient().auth.signIn(email, password);
    accessToken = result.accessToken;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "An unexpected error occurred";
    return { error: message };
  }
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "";
  cookieStore.set(SESSION_COOKIE, accessToken, getCookieOptions(host));
  // redirect() throws NEXT_REDIRECT - must NOT be inside the try/catch above.
  redirect(await resolveLandingRedirect(accessToken));
}

/**
 * Resolve the best landing page from the user's approved memberships:
 * MSP platform-admins land in /admin, everyone else in the portal.
 */
async function resolveLandingRedirect(accessToken: string): Promise<string> {
  try {
    const authedClient = MCTClient.create({
      baseUrl: getClientEnv().NEXT_PUBLIC_API_URL,
      getToken: async () => accessToken,
    });
    const me = await authedClient.users.me();
    if (me?.userId) {
      const memberships = await authedClient.memberships.list({
        userId: me.userId,
        status: "approved",
      });
      const isAdmin = memberships.some((m) => {
        const role = m.roles;
        return role && isPlatformAdminKey(role.key);
      });
      if (isAdmin) return "/admin";
    }
  } catch {
    // Fall back to the portal dashboard if the role lookup fails
  }
  return "/portal/dashboard";
}

export type TestLoginResult = { ok: true; redirectTo: string } | { ok: false; error: string };

/**
 * One-click login for the dev/test-accounts page. Sets the session
 * cookie (no redirect) and resolves the best landing page from the
 * user's approved memberships (admins land in /admin).
 */
export async function testLoginAction(email: string, password: string): Promise<TestLoginResult> {
  try {
    const client = unauthClient();
    const result = await client.auth.signIn(email, password);
    const cookieStore = await cookies();
    const headersList = await headers();
    const host = headersList.get("host") || "";
    cookieStore.set(SESSION_COOKIE, result.accessToken, getCookieOptions(host));

    let redirectTo = "/portal/dashboard";
    try {
      // Use an authenticated client for the role lookup (me + memberships
      // require the bearer token, not just the cookie).
      redirectTo = await resolveLandingRedirect(result.accessToken);
    } catch {
      // Fall back to the portal dashboard if the role lookup fails
    }

    return { ok: true, redirectTo };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "An unexpected error occurred";
    return { ok: false, error: message };
  }
}

export async function signupAction(email: string, password: string, fullName: string) {
  try {
    await unauthClient().auth.signUp(email, password, fullName);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "An unexpected error occurred";
    return { error: message };
  }
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete("mct_active_org");
  redirect("/login");
}
