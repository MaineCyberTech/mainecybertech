"use client";

import { useEffect, useState } from "react";

/**
 * USE-P3-002: tell the user when the app is offline.
 *
 * Without this, a flaky connection surfaced as silent stale/empty screens (or
 * a generic error boundary). The banner reflects `navigator.onLine` and lets
 * the user retry once the connection is back; the service worker's offline
 * page handles full navigations that never reach the server.
 */
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOffline(navigator.onLine === false);

    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[90] flex flex-wrap items-center justify-center gap-3 border-t border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 backdrop-blur"
    >
      <span>
        You are offline. Some data may be out of date until the connection returns.
      </span>
      <button
        type="button"
        className="cyber-button-secondary text-xs"
        onClick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  );
}
