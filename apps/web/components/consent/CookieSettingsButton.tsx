"use client";

import { useConsent } from "./ConsentProvider";

/**
 * PRIV-P2-001: visible opt-out entry point. Lives in the marketing footer and
 * reopens the consent banner so a stored choice can be changed or withdrawn.
 */
export default function CookieSettingsButton() {
  const { openPreferences } = useConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="text-xs text-slate-500 transition hover:text-emerald-400"
    >
      Cookie settings
    </button>
  );
}
