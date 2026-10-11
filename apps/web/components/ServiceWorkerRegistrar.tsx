"use client";

import { useEffect } from "react";

/**
 * MOB-P2-001: register the portal service worker so offline fallback is live.
 *
 * Production-only: a worker registered from `next dev` would keep serving
 * cached assets across rebuilds and confuse local development. The worker's
 * fetch handler (public/sw.js) never caches API traffic or page HTML, so
 * registering it cannot capture authenticated responses (MOB-P2-002).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  }, []);

  return null;
}
