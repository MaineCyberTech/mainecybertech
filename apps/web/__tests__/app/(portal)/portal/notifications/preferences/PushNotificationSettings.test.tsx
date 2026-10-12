import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

const mockGetVapidPublicKey = jest.fn();
const mockSubscribePush = jest.fn();
const mockUnsubscribePush = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    notifications: {
      getVapidPublicKey: mockGetVapidPublicKey,
      subscribePush: mockSubscribePush,
      unsubscribePush: mockUnsubscribePush,
    },
  }),
}));

import PushNotificationSettings from "@/app/(portal)/portal/notifications/preferences/PushNotificationSettings";

const originalNotification = Object.getOwnPropertyDescriptor(globalThis, "Notification");
const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
const originalPushManager = Object.getOwnPropertyDescriptor(window, "PushManager");

function restoreGlobal(target: object, key: string, descriptor?: PropertyDescriptor) {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
  } else {
    delete (target as Record<string, unknown>)[key];
  }
}

/** Install the browser APIs the component needs; `permission` is initial state. */
function installPushBrowser(options: {
  permission?: NotificationPermission;
  subscription?: {
    endpoint: string;
    unsubscribe: jest.Mock;
    toJSON: () => { keys: { p256dh: string; auth: string } };
  } | null;
  requestPermission?: jest.Mock;
}) {
  const subscription = options.subscription ?? null;
  const registration = {
    pushManager: {
      getSubscription: jest.fn().mockResolvedValue(subscription),
      subscribe: jest.fn(),
    },
  };

  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      getRegistration: jest.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    },
    configurable: true,
  });
  Object.defineProperty(window, "PushManager", {
    value: function PushManager() {},
    configurable: true,
  });
  Object.defineProperty(globalThis, "Notification", {
    value: {
      permission: options.permission ?? "default",
      requestPermission:
        options.requestPermission ?? jest.fn().mockResolvedValue("granted"),
    },
    configurable: true,
  });

  return { registration, subscription };
}

afterEach(() => {
  restoreGlobal(globalThis, "Notification", originalNotification);
  restoreGlobal(navigator, "serviceWorker", originalServiceWorker);
  restoreGlobal(window, "PushManager", originalPushManager);
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetVapidPublicKey.mockResolvedValue({ enabled: true, publicKey: "AQAB" });
});

describe("PushNotificationSettings (NOTIF-P2-001)", () => {
  it("shows unsupported when the browser cannot do push", async () => {
    render(<PushNotificationSettings />);
    expect(
      await screen.findByText(/this browser does not support push notifications/i),
    ).toBeInTheDocument();
  });

  it("hides the control when the server has no VAPID keys", async () => {
    installPushBrowser({});
    mockGetVapidPublicKey.mockResolvedValue({ enabled: false, publicKey: null });

    render(<PushNotificationSettings />);

    expect(
      await screen.findByText(/push notifications are not configured on this server/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enable browser push/i })).not.toBeInTheDocument();
  });

  it("does not request permission on mount", async () => {
    const requestPermission = jest.fn().mockResolvedValue("granted");
    installPushBrowser({ requestPermission });

    render(<PushNotificationSettings />);

    expect(await screen.findByRole("button", { name: /enable browser push/i })).toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("requests permission and registers the endpoint on user action", async () => {
    const subscription = {
      endpoint: "https://push.example.com/wpush/v2/abc",
      unsubscribe: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ keys: { p256dh: "p256dh-key", auth: "auth-secret" } }),
    };
    const { registration } = installPushBrowser({});
    registration.pushManager.subscribe = jest.fn().mockResolvedValue(subscription);
    mockSubscribePush.mockResolvedValue({ id: "sub-1", endpoint: subscription.endpoint });

    render(<PushNotificationSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /enable browser push/i }));

    await waitFor(() =>
      expect(mockSubscribePush).toHaveBeenCalledWith({
        endpoint: subscription.endpoint,
        keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      }),
    );
    expect(
      await screen.findByText(/push notifications are enabled on this browser/i),
    ).toBeInTheDocument();
  });

  it("revokes the endpoint then unsubscribes when disabled", async () => {
    const subscription = {
      endpoint: "https://push.example.com/wpush/v2/abc",
      unsubscribe: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ keys: { p256dh: "p256dh-key", auth: "auth-secret" } }),
    };
    installPushBrowser({ permission: "granted", subscription });
    mockUnsubscribePush.mockResolvedValue({ revoked: 1 });

    render(<PushNotificationSettings />);
    fireEvent.click(await screen.findByRole("button", { name: /disable browser push/i }));

    await waitFor(() =>
      expect(mockUnsubscribePush).toHaveBeenCalledWith({ endpoint: subscription.endpoint }),
    );
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: /enable browser push/i }),
    ).toBeInTheDocument();
  });

  it("explains how to recover when notifications are blocked", async () => {
    installPushBrowser({ permission: "denied" });

    render(<PushNotificationSettings />);

    expect(
      await screen.findByText(/notifications are blocked for this site/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enable browser push/i })).not.toBeInTheDocument();
  });
});
