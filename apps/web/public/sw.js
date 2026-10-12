/**
 * Maine CyberTech portal service worker.
 *
 * Cache policy (MOB-P2-001 / MOB-P2-002):
 * - `/api/` requests and any non-GET request are never intercepted: the
 *   Cache API ignores `no-store`/`private`, so authenticated JSON must not
 *   enter Cache Storage at all.
 * - Only same-origin static assets (script/style/font/image/manifest
 *   destinations) are cached. They are public and content-hashed by Next.js.
 * - Navigation requests are network-first. On failure they fall back to an
 *   offline HTML response precached at install; authenticated page HTML is
 *   never written to the cache.
 * - Network responses carrying `Cache-Control: no-store` or `private` are
 *   never cached.
 * - `PURGE_CACHES` clears every cache. Only public static assets are cached
 *   today, so there is no user-scoped cache to purge on logout yet; the
 *   handler exists so a future logout hook can clear one.
 *
 * Push (NOTIF-P2-001):
 * - `push` shows a notification from the worker's `notification-push`
 *   payload ({ title, body, url? }) and `notificationclick` focuses an
 *   existing portal tab or opens the deep link. Both only ever navigate to a
 *   same-origin URL — a push payload must not be able to send the user to an
 *   attacker-controlled origin.
 *
 * Serve this file with `Cache-Control: no-cache` (see next.config.mjs) so
 * browser updates are picked up on the next navigation.
 */

const CACHE_NAME = "mct-static-v2";
const OFFLINE_URL = "/offline";

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Offline | MCT Portal</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #0a1118;
        color: #f8fafc;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        text-align: center;
      }
      h1 { margin: 0 0 8px; font-size: 1.5rem; }
      p { margin: 0 0 24px; color: #94a3b8; }
      a { color: #34d399; }
    </style>
  </head>
  <body>
    <main>
      <h1>You&rsquo;re offline</h1>
      <p>The portal needs a network connection. Check your connection and try again.</p>
      <a href="/">Retry</a>
    </main>
  </body>
</html>`;

const STATIC_DESTINATIONS = new Set(["script", "style", "font", "image", "manifest"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.put(
        OFFLINE_URL,
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "PURGE_CACHES") return;
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
  );
});

// NOTIF-P2-001: show a notification for a push message. Payload shape is
// produced by apps/worker/src/push.ts (buildPushPayload).
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = typeof data.title === "string" && data.title ? data.title : "Maine CyberTech";
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: { url: typeof data.url === "string" ? data.url : "/portal/notifications" },
    ...(typeof data.tag === "string" && data.tag ? { tag: data.tag } : {}),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing portal tab when possible, otherwise open the deep link.
// Only same-origin targets are ever navigated to.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let target = "/portal/notifications";
  try {
    const parsed = new URL(event.notification.data && event.notification.data.url ? event.notification.data.url : target, self.location.origin);
    if (parsed.origin === self.location.origin) target = parsed.href;
  } catch {
    target = "/portal/notifications";
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            try {
              await client.navigate(target);
            } catch {
              // Navigation is best-effort; focusing the current page still
              // surfaces the notification context.
            }
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

function isCacheableResponse(response) {
  if (!response.ok) return false;
  const cacheControl = response.headers.get("Cache-Control") || "";
  return !/\bno-store\b|\bprivate\b/i.test(cacheControl);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, copy);
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Authenticated API traffic always goes straight to the network.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
