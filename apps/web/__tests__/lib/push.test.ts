import { isPushSupported, urlBase64ToUint8Array } from "@/lib/push";

describe("urlBase64ToUint8Array", () => {
  it("decodes standard base64url VAPID key material", () => {
    // 0x01 0x00 0x01 — the classic RSA exponent encoding.
    expect(Array.from(urlBase64ToUint8Array("AQAB"))).toEqual([0x01, 0x00, 0x01]);
  });

  it("handles - and _ characters and missing padding", () => {
    expect(Array.from(urlBase64ToUint8Array("_-8"))).toEqual([0xfb, 0xff]);
  });
});

describe("isPushSupported", () => {
  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
    delete (window as unknown as Record<string, unknown>).PushManager;
  });

  it("is false when the browser has no service worker support", () => {
    expect(isPushSupported()).toBe(false);
  });

  it("is true when service workers, PushManager and Notification all exist", () => {
    Object.defineProperty(navigator, "serviceWorker", { value: {}, configurable: true });
    Object.defineProperty(window, "PushManager", { value: function PushManager() {}, configurable: true });
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Notification");
    Object.defineProperty(globalThis, "Notification", {
      value: { permission: "default" },
      configurable: true,
    });
    try {
      expect(isPushSupported()).toBe(true);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "Notification", descriptor);
      } else {
        delete (globalThis as unknown as Record<string, unknown>).Notification;
      }
    }
  });
});
