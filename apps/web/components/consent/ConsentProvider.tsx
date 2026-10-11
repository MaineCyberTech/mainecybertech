"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readStoredConsent, writeStoredConsent, type ConsentChoice } from "../../lib/consent";

interface ConsentContextValue {
  /** null until the stored choice has been read on the client. */
  choice: ConsentChoice | null;
  bannerOpen: boolean;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const noop = () => {};

const ConsentContext = createContext<ConsentContextValue>({
  choice: null,
  bannerOpen: false,
  acceptAnalytics: noop,
  rejectAnalytics: noop,
  openPreferences: noop,
  closePreferences: noop,
});

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}

/**
 * PRIV-P2-001: holds the analytics/chat consent decision for the public site.
 *
 * The initial state is "not loaded yet", which renders exactly what the server
 * rendered (no hydration mismatch) and keeps every consent-dependent script
 * unmounted until the stored choice has been read in the browser. Default
 * behavior is deny: with no stored choice the banner opens and nothing loads.
 */
export default function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setChoice(stored.analytics);
    } else {
      setBannerOpen(true);
    }
  }, []);

  const choose = useCallback((next: ConsentChoice) => {
    writeStoredConsent(next);
    setChoice(next);
    setBannerOpen(false);
  }, []);

  const acceptAnalytics = useCallback(() => choose("granted"), [choose]);
  const rejectAnalytics = useCallback(() => choose("denied"), [choose]);
  const openPreferences = useCallback(() => setBannerOpen(true), []);
  const closePreferences = useCallback(() => setBannerOpen(false), []);

  const value = useMemo(
    () => ({
      choice,
      bannerOpen,
      acceptAnalytics,
      rejectAnalytics,
      openPreferences,
      closePreferences,
    }),
    [choice, bannerOpen, acceptAnalytics, rejectAnalytics, openPreferences, closePreferences],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
