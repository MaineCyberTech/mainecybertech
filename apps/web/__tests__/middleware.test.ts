import fs from "node:fs";
import path from "node:path";
import { webcrypto } from "node:crypto";
import * as ts from "typescript";

import type { NextRequest } from "next/server";

import { middleware, config } from "../middleware";

const SESSION_COOKIE = "mct_session";

jest.mock("next/server", () => {
  const createResponse = () => ({
    headers: new Headers(),
    cookies: { set: jest.fn(), get: jest.fn(() => undefined) },
  });
  return {
    NextResponse: {
      next: jest.fn(() => createResponse()),
      redirect: jest.fn(() => createResponse()),
      rewrite: jest.fn(() => createResponse()),
    },
  };
});

const mockNextServer = jest.requireMock("next/server") as {
  NextResponse: {
    next: jest.Mock;
    redirect: jest.Mock;
    rewrite: jest.Mock;
  };
};
const { NextResponse } = mockNextServer;

function encodePayload(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function makeToken(payload: Record<string, unknown>): string {
  return `header.${encodePayload(payload)}.signature`;
}

const expiredToken = (): string =>
  makeToken({ sub: "user-1", exp: Math.floor(Date.now() / 1000) - 3600 });
const validToken = (): string =>
  makeToken({ sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 });
const noExpToken = (): string => makeToken({ sub: "user-1" });

interface FakeRequestOptions {
  host?: string;
  pathname?: string;
  token?: string | null;
}

function makeRequest(options: FakeRequestOptions = {}): NextRequest {
  const host = options.host ?? "localhost:3000";
  const pathname = options.pathname ?? "/";
  const url = `https://${host}${pathname}`;
  return {
    url,
    headers: new Headers({ host }),
    nextUrl: { pathname, hostname: host, searchParams: new URLSearchParams() },
    cookies: {
      get: jest.fn(() => (options.token ? { value: options.token } : undefined)),
    },
  } as unknown as NextRequest;
}

function loadMiddlewareInternals(): { isTokenExpired: (token: string) => boolean } {
  const filePath = path.resolve(__dirname, "../middleware.ts");
  const source = fs
    .readFileSync(filePath, "utf8")
    .replace(/^import .*$/gm, "")
    .concat("\nmodule.exports = { isTokenExpired };");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const moduleRef = { exports: {} as Record<string, unknown> };
  const factory = new Function("module", "exports", "crypto", "Buffer", "URL", "Headers", outputText);
  factory(moduleRef, moduleRef.exports, webcrypto, Buffer, URL, Headers);
  return moduleRef.exports as { isTokenExpired: (token: string) => boolean };
}

function lastRedirect(): URL {
  expect(NextResponse.redirect).toHaveBeenCalled();
  const calls = NextResponse.redirect.mock.calls as unknown[][];
  const url = calls[calls.length - 1]?.[0] as URL | undefined;
  expect(url).toBeDefined();
  return url as URL;
}

function expectRedirect(pathname: string, host?: string): void {
  const url = lastRedirect();
  expect(url.pathname).toBe(pathname);
  if (host) expect(url.host).toBe(host);
}

function expectPassedThrough(): void {
  expect(NextResponse.next).toHaveBeenCalled();
  expect(NextResponse.redirect).not.toHaveBeenCalled();
}

beforeAll(() => {
  if (typeof (globalThis as { crypto?: Crypto }).crypto?.getRandomValues !== "function") {
    (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
  }
});

beforeEach(() => {
  NextResponse.next.mockClear();
  NextResponse.redirect.mockClear();
  NextResponse.rewrite.mockClear();
});

describe("isTokenExpired", () => {
  it("returns true for an expired token", () => {
    expect(loadMiddlewareInternals().isTokenExpired(expiredToken())).toBe(true);
  });

  it("returns false for a valid (unexpired) token", () => {
    expect(loadMiddlewareInternals().isTokenExpired(validToken())).toBe(false);
  });

  it("returns true for malformed tokens", () => {
    const internals = loadMiddlewareInternals();
    expect(internals.isTokenExpired("not-a-jwt")).toBe(true);
    expect(internals.isTokenExpired("a.b")).toBe(true);
    expect(internals.isTokenExpired("a..c")).toBe(true);
    expect(internals.isTokenExpired("a.%%%.c")).toBe(true);
  });

  it("returns true for a token without an exp claim", () => {
    expect(loadMiddlewareInternals().isTokenExpired(noExpToken())).toBe(true);
  });
});

describe("auth redirects", () => {
  it("redirects an unauthenticated /portal/dashboard request to /login", async () => {
    await middleware(makeRequest({ pathname: "/portal/dashboard" }));
    expectRedirect("/login");
  });

  it("redirects an unauthenticated /admin request to /login", async () => {
    await middleware(makeRequest({ pathname: "/admin/users" }));
    expectRedirect("/login");
  });

  it("redirects an authenticated /login request to /portal/dashboard", async () => {
    await middleware(makeRequest({ pathname: "/login", token: validToken() }));
    expectRedirect("/portal/dashboard");
  });

  it("redirects an authenticated /signup request to /portal/dashboard", async () => {
    await middleware(makeRequest({ pathname: "/signup", token: validToken() }));
    expectRedirect("/portal/dashboard");
  });

  it("lets an authenticated /portal/dashboard request pass through", async () => {
    await middleware(makeRequest({ pathname: "/portal/dashboard", token: validToken() }));
    expectPassedThrough();
  });

  it("treats an expired auth cookie as unauthenticated", async () => {
    await middleware(makeRequest({ pathname: "/portal/dashboard", token: expiredToken() }));
    expectRedirect("/login");
  });

  it("treats a malformed auth cookie as unauthenticated", async () => {
    await middleware(makeRequest({ pathname: "/portal/dashboard", token: "garbage" }));
    expectRedirect("/login");
  });
});

describe("domain routing", () => {
  it("passes marketing routes through on the www host", async () => {
    for (const pathname of ["/", "/services/msp", "/contact"]) {
      await middleware(makeRequest({ host: "www.mainecybertech.com", pathname }));
      expectPassedThrough();
      NextResponse.next.mockClear();
      NextResponse.redirect.mockClear();
    }
  });

  it("redirects the marketing root to /login on the app.* host", async () => {
    await middleware(makeRequest({ host: "app.mainecybertech.com", pathname: "/" }));
    expectRedirect("/login");
  });

  it("redirects portal routes on the www host to the app.* host", async () => {
    await middleware(
      makeRequest({ host: "www.mainecybertech.com", pathname: "/portal/support" }),
    );
    expectRedirect("/portal/support", "app.mainecybertech.com");
  });

  it("redirects login on the www host to the app.* host", async () => {
    await middleware(makeRequest({ host: "www.mainecybertech.com", pathname: "/login" }));
    expectRedirect("/login", "app.mainecybertech.com");
  });

  it("skips domain routing on localhost and 127.0.0.1", async () => {
    await middleware(makeRequest({ host: "localhost:3000", pathname: "/" }));
    expectPassedThrough();
    NextResponse.next.mockClear();
    NextResponse.redirect.mockClear();
    await middleware(makeRequest({ host: "127.0.0.1", pathname: "/" }));
    expectPassedThrough();
  });
});

describe("CSP and nonce headers", () => {
  it("sets the x-nonce and Content-Security-Policy headers on the response", async () => {
    const response = await middleware(
      makeRequest({ host: "www.mainecybertech.com", pathname: "/contact" }),
    );
    expect(response.headers.get("x-nonce")).toBeTruthy();
    expect(response.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });

  it("includes unsafe-eval in the CSP for a localhost host", async () => {
    const response = await middleware(makeRequest({ host: "localhost:3000", pathname: "/" }));
    expect(response.headers.get("Content-Security-Policy")).toContain("unsafe-eval");
  });

  it("excludes unsafe-eval and includes the api origin in the CSP for a prod host", async () => {
    const response = await middleware(
      makeRequest({ host: "www.mainecybertech.com", pathname: "/" }),
    );
    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("https://api.mainecybertech.com");
  });

  it("derives the api origin from an app.* host", async () => {
    const response = await middleware(
      makeRequest({ host: "app.mainecybertech.com", pathname: "/login", token: validToken() }),
    );
    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("https://api.mainecybertech.com");
  });
});

describe("config", () => {
  it("exports a matcher that skips _next and favicon.ico", () => {
    expect(config.matcher).toHaveLength(1);
    expect(config.matcher[0]).toContain("_next");
    expect(config.matcher[0]).toContain("favicon.ico");
  });
});
