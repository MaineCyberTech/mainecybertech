/**
 * Browser push helpers (NOTIF-P2-001).
 *
 * The VAPID public key from the API is base64url-encoded; `PushManager`
 * requires the raw bytes of the P-256 point.
 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Allocate an explicit ArrayBuffer: lib.dom's BufferSource requires
  // ArrayBufferView<ArrayBuffer>, and a bare `Uint8Array` is typed over
  // ArrayBufferLike (which includes SharedArrayBuffer) under TS >= 5.7.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

/** True when this browser can register and receive push notifications. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
