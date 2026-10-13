"use client";

import { useCallback, useEffect, useState } from "react";
import { getClientApi } from "@/lib/client-api";
import { isPushSupported, urlBase64ToUint8Array } from "@/lib/push";

/**
 * Browser push opt-in (NOTIF-P2-001).
 *
 * Separate from the per-module preferences table because it manages the
 * browser's push subscription itself, not a preference row. The permission
 * prompt is only ever triggered by the explicit "Enable" click — never on
 * mount — and the operator gate (`enabled: false` from the API) hides the
 * control entirely when VAPID is not configured.
 */

type PushState =
  | "loading"
  | "unsupported"
  | "unavailable"
  | "denied"
  | "subscribed"
  | "unsubscribed"
  | "error";

export default function PushNotificationSettings() {
  const [state, setState] = useState<PushState>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      setState("unsupported");
      return;
    }

    try {
      const key = await getClientApi().notifications.getVapidPublicKey();
      if (!key.enabled || !key.publicKey) {
        setState("unavailable");
        return;
      }
      setPublicKey(key.publicKey);

      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (subscription) {
        setState("subscribed");
      } else if (Notification.permission === "denied") {
        setState("denied");
      } else {
        setState("unsubscribed");
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to load push notification status.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enablePush() {
    if (!publicKey) return;
    setBusy(true);
    setError(null);

    try {
      // User-gesture only: the permission prompt must never appear on mount.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        throw new Error("The portal service worker is not active yet. Reload the page and try again.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();

      await getClientApi().notifications.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });

      setState("subscribed");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to enable push notifications. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      if (subscription) {
        // Revoke server-side first: if the API call fails the browser
        // subscription stays intact and the user can retry.
        await getClientApi().notifications.unsubscribePush({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setState("unsubscribed");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to disable push notifications. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="push-notifications-heading"
      className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
    >
      <h2
        id="push-notifications-heading"
        className="font-display text-sm uppercase tracking-[0.14em] text-slate-200"
      >
        Browser push
      </h2>

      {state === "loading" ? (
        <p className="mt-2 text-sm text-slate-400">Checking push notification status...</p>
      ) : null}

      {state === "unsupported" ? (
        <p className="mt-2 text-sm text-slate-400">
          This browser does not support push notifications.
        </p>
      ) : null}

      {state === "unavailable" ? (
        <p className="mt-2 text-sm text-slate-400">
          Push notifications are not configured on this server. Use the Push column above to keep
          the preference saved for when the operator enables the channel.
        </p>
      ) : null}

      {state === "denied" ? (
        <p className="mt-2 text-sm text-slate-400">
          Notifications are blocked for this site in your browser settings. Allow notifications for
          the portal and try again.
        </p>
      ) : null}

      {state === "unsubscribed" ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-slate-400">
            Receive portal notifications in this browser, even when the tab is in the background.
            Use the Push column above to choose which modules send them.
          </p>
          <button onClick={() => void enablePush()} disabled={busy} className="cyber-button">
            {busy ? "Enabling..." : "Enable browser push"}
          </button>
        </div>
      ) : null}

      {state === "subscribed" ? (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-emerald-300">Push notifications are enabled on this browser.</p>
          <button
            onClick={() => void disablePush()}
            disabled={busy}
            className="cyber-button-secondary"
          >
            {busy ? "Disabling..." : "Disable browser push"}
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <p>{error}</p>
          {state === "error" ? (
            <button onClick={() => void refresh()} className="cyber-button-secondary mt-2 text-xs">
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
