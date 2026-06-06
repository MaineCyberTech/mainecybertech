import { NextResponse } from "next/server";

const SESSION_COOKIE = "mct_session";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_code: code,
        cookies: request.headers.get("cookie") || "",
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.success || !json.data?.accessToken) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const response = NextResponse.redirect(`${origin}/portal/dashboard`);
    response.cookies.set(SESSION_COOKIE, json.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.redirect(`${origin}/login`);
  }
}
