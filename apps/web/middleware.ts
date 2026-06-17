import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mct_session";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );
    return payload.exp ? payload.exp * 1000 < Date.now() : true;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname;

  const isAppDomain = hostname.startsWith("app.");

  const isMarketingRoute =
    pathname === "/" ||
    pathname.startsWith("/services") ||
    pathname === "/contact";

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/password-reset") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/auth/callback");

  const isPortalRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/portal");

  const isAdminRoute = pathname.startsWith("/admin");

  const isAuthenticated = token ? !isTokenExpired(token) : false;

  // Domain-based routing: app.* for portal/auth, www/root for marketing
  if (isAppDomain && isMarketingRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isAppDomain && (isAuthRoute || isPortalRoute || isAdminRoute)) {
    const url = new URL(request.url);
    url.hostname = `app.${hostname}`;
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && isPortalRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
