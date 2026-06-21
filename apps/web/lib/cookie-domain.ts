export function getCookieDomain(host: string): string | undefined {
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return undefined;
  }

  const parts = host.split(".");
  if (parts.length >= 3) {
    return `.${parts.slice(-2).join(".")}`;
  }

  return undefined;
}

export function getCookieOptions(host: string) {
  const domain = getCookieDomain(host);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    domain,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getDeleteCookieOptions(host: string) {
  const domain = getCookieDomain(host);

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? ("none" as const)
        : ("lax" as const),
    domain,
    path: "/",
  };
}
