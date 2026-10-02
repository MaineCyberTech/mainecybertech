"use client";

import { APP_VERSION, GIT_SHA, BUILD_TIME } from "@/lib/version";
import { formatDateUtc } from "@/lib/format";

export function VersionBadge() {
  const shortSha = GIT_SHA.length > 7 ? GIT_SHA.slice(0, 7) : GIT_SHA;
  // Explicit locale + UTC keeps the rendered date identical on server and
  // client — plain toLocaleDateString() uses the runtime locale, which differs
  // between the Docker/UTC server and the user's browser, causing a hydration
  // mismatch (React error #418) on every page.
  const buildDate = formatDateUtc(BUILD_TIME);

  return (
    <div className="fixed bottom-2 right-2 z-40 hidden select-none items-center gap-1.5 rounded border border-white/10 bg-cyber-base/80 px-2 py-1 font-mono text-xs text-slate-400 shadow-sm backdrop-blur-sm lg:block">
      <span className="opacity-60">v</span>
      <span>{APP_VERSION}</span>
      <span className="opacity-40">·</span>
      <span title={GIT_SHA}>{shortSha}</span>
      <span className="opacity-40">·</span>
      <span title={BUILD_TIME}>{buildDate}</span>
    </div>
  );
}
