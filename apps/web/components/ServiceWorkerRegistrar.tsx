"use client";

import { useEffect } from "react";

/**
 * MOB-P2-001 / USE-P3-002: register the portal service worker so offline
 * fallback is live.
 *
 * Production-only: a worker registered from `next dev` would keep serving
 * cached assets across rebuilds and confuse local development. The worker's
 * fetch handler (public/sw.js) never caches API traffic or page HTML, so
 * registering it cannot capture authenticated responses (MOB-P2-002).
 *
 * Scope is pinned to "/" (the default for a root-served script) so the worker
 * controls the portal shell and the offline fallback, but not API routes.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => registration.update())
      .catch((error: unknown) => {
        console.error("Service worker registration failed", error);
      });
  }, []);

  return null;
}
