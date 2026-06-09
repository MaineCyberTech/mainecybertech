import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mct_session";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    return payload.exp ? payload.exp * 1000 < Date.now() : true;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/auth/callback");

  const isPortalRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/portal");

  const isAuthenticated = token ? !isTokenExpired(token) : false;

  if (!isAuthenticated && isPortalRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};