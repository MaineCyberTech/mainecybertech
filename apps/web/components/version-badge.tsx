"use client";

import { APP_VERSION, GIT_SHA, BUILD_TIME } from "@/lib/version";

export function VersionBadge() {
  const shortSha = GIT_SHA.length > 7 ? GIT_SHA.slice(0, 7) : GIT_SHA;
  // Explicit locale keeps the rendered date identical on server and client —
  // plain toLocaleDateString() uses the runtime locale, which differs between
  // the Docker/UTC server and the user's browser, causing a hydration
  // mismatch (React error #418) on every page.
  const buildDate = new Date(BUILD_TIME).toLocaleDateString("en-US", {
    timeZone: "UTC",
  });

  return (
    <div className="border-[var(--color-border-primary)]/50 bg-[var(--color-background-secondary)]/80 fixed bottom-2 right-2 z-40 flex select-none items-center gap-1.5 rounded border px-2 py-1 font-mono text-xs text-[var(--color-foreground-tertiary)] shadow-sm backdrop-blur-sm">
      <span className="opacity-60">v</span>
      <span>{APP_VERSION}</span>
      <span className="opacity-40">·</span>
      <span title={GIT_SHA}>{shortSha}</span>
      <span className="opacity-40">·</span>
      <span title={BUILD_TIME}>{buildDate}</span>
    </div>
  );
}
