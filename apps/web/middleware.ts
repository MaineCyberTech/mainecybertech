import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mct_session";

/**
 * ARCH-P3-001 — this is a best-effort, non-authoritative UX gate.
 *
 * `isTokenExpired` base64-decodes the JWT payload and reads `exp` without
 * verifying the signature. The `mct_session` value is client-presented, so a
 * forged-but-unexpired cookie reaches only the page shell — it is never
 * treated as authorization. Every server component/server action re-checks the
 * session by calling the API with the token (`apps/web/lib/api.ts` →
 * `api.users.me()` / memberships in `lib/auth/membership.ts`), and the API
 * verifies the JWT signature (`apps/api/src/middleware/auth.ts`). Do not add
 * data access that relies on `isAuthenticated` here.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
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

const CSP_REPORT_PATH = "/api/v1/public/csp-report";

function cspReportUrl(apiUrl: string | undefined): string | undefined {
  if (!apiUrl) return undefined;
  return `${apiUrl.replace(/\/+$/, "")}${CSP_REPORT_PATH}`;
}

/**
 * Build the Content-Security-Policy for the request.
 *
 * Production uses a nonce-based script policy. Next.js reads the nonce from
 * the `Content-Security-Policy` request header and applies it to its own
 * inline scripts; app components read the nonce from `x-nonce` and pass it to
 * third-party <Script> tags (GA, Tawk.to). Local dev keeps 'unsafe-inline' /
 * 'unsafe-eval' so React Fast Refresh works.
 *
 * Production also reports violations to the API when NEXT_PUBLIC_API_URL is
 * configured; without it the reporting directives are omitted.
 */
function buildCsp(nonce: string, host: string, isLocalDev: boolean, apiUrl?: string): string {
  if (isLocalDev) {
    return `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co`;
  }
  const apiOrigin = `https://${host.replace(/^(www|app)\./, "api.")}`;
  const reportUrl = cspReportUrl(apiUrl);
  const reporting = reportUrl ? `; report-uri ${reportUrl}; report-to csp-endpoint` : "";
  return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${apiOrigin} wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'${reporting}`;
}

function applyCsp(response: NextResponse, csp: string, reportUrl?: string): void {
  response.headers.set("Content-Security-Policy", csp);
  if (!reportUrl) return;
  response.headers.set(
    "Report-To",
    JSON.stringify({
      group: "csp-endpoint",
      max_age: 10886400,
      endpoints: [{ url: reportUrl }],
    }),
  );
  response.headers.set("Reporting-Endpoints", `csp-endpoint="${reportUrl}"`);
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || request.nextUrl.hostname;
  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");
  const reportUrl = isLocalDev ? undefined : cspReportUrl(process.env.NEXT_PUBLIC_API_URL);
  const csp = buildCsp(nonce, host, isLocalDev, process.env.NEXT_PUBLIC_API_URL);

  // Propagate the nonce + CSP to the app. Next.js extracts the nonce from the
  // CSP request header for its own inline scripts; components read x-nonce.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const isAppDomain = host.startsWith("app.");

  const isMarketingRoute =
    pathname === "/" || pathname.startsWith("/services") || pathname === "/contact";

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/password-reset") ||
    pathname.startsWith("/pending") ||
    pathname.startsWith("/auth/callback");

  const isPortalRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/portal");

  const isAdminRoute = pathname.startsWith("/admin");

  const isAuthenticated = token ? !isTokenExpired(token) : false;

  // Domain-based routing: app.* for portal/auth, www/root for marketing
  if (!isLocalDev) {
    const appHost = host.startsWith("app.") ? host : `app.${host.replace(/^www\./, "")}`;

    if (isAppDomain && isMarketingRoute) {
      const redirect = NextResponse.redirect(new URL("/login", request.url));
      applyCsp(redirect, csp, reportUrl);
      return redirect;
    }

    if (!isAppDomain && (isAuthRoute || isPortalRoute || isAdminRoute)) {
      const redirect = NextResponse.redirect(new URL(pathname, `https://${appHost}`));
      applyCsp(redirect, csp, reportUrl);
      return redirect;
    }
  }

  if (!isAuthenticated && (isPortalRoute || isAdminRoute)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    applyCsp(redirect, csp, reportUrl);
    return redirect;
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    const redirect = NextResponse.redirect(new URL("/portal/dashboard", request.url));
    applyCsp(redirect, csp, reportUrl);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-nonce", nonce);
  applyCsp(response, csp, reportUrl);
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
