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

function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars[bytes[i] % chars.length];
  }
  return nonce;
}

function setCspHeaders(
  response: NextResponse,
  nonce: string,
): void {
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'`,
  );
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || request.nextUrl.hostname;

  const isAppDomain = host.startsWith("app.");

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

  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");

  // Domain-based routing: app.* for portal/auth, www/root for marketing
  if (!isLocalDev) {
    const appHost = host.startsWith("app.")
      ? host
      : `app.${host.replace(/^www\./, "")}`;

    if (isAppDomain && isMarketingRoute) {
      const redirect = NextResponse.redirect(new URL("/login", request.url));
      setCspHeaders(redirect, nonce);
      return redirect;
    }

    if (!isAppDomain && (isAuthRoute || isPortalRoute || isAdminRoute)) {
      const redirect = NextResponse.redirect(
        new URL(pathname, `https://${appHost}`),
      );
      setCspHeaders(redirect, nonce);
      return redirect;
    }
  }

  if (!isAuthenticated && isPortalRoute) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    setCspHeaders(redirect, nonce);
    return redirect;
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const redirect = NextResponse.redirect(
      new URL("/portal/dashboard", request.url),
    );
    setCspHeaders(redirect, nonce);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  setCspHeaders(response, nonce);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
