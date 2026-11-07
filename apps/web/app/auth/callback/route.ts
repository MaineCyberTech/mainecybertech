import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/cookie-domain";
import { getClientEnv } from "@/lib/env";
import { resolvePostAuthRedirect, resolvePublicOrigin } from "@/lib/auth/callback-redirect";
import { extractPkceVerifierCookies } from "@/lib/auth/callback-cookies";

const SESSION_COOKIE = "mct_session";
const API_URL = getClientEnv().NEXT_PUBLIC_API_URL;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = resolvePublicOrigin(request.url, process.env.APP_BASE_URL);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const host = request.headers.get("host") || "";

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    // SEC-P3-017: only the PKCE verifier cookie is needed by the API. Never
    // forward mct_session, csrf_token or mct_active_org in the request body.
    const verifierCookies = extractPkceVerifierCookies(request.headers.get("cookie"));
    const res = await fetch(`${API_URL}/api/v1/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_code: code,
        ...(verifierCookies ? { cookies: verifierCookies } : {}),
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.success || !json.data?.accessToken) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const response = NextResponse.redirect(`${origin}${resolvePostAuthRedirect(next)}`);
    response.cookies.set(SESSION_COOKIE, json.data.accessToken, getCookieOptions(host));

    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }
}
