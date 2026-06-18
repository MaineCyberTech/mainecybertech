import { jest } from "@jest/globals";

// Create a mutable env mock shared across imports via Proxy
const envMock: Record<string, string | undefined> = {};

function resetEnvMock(): void {
  envMock.LOG_LEVEL = "silent";
  envMock.SUPABASE_URL = "https://test.supabase.co";
  envMock.SUPABASE_ANON_KEY = "test-anon-key";
  envMock.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  envMock.STRIPE_SECRET_KEY = undefined;
  envMock.JIRA_BASE_URL = undefined;
  envMock.JIRA_EMAIL = undefined;
  envMock.JIRA_API_TOKEN = undefined;
  envMock.JSM_BASE_URL = undefined;
  envMock.JSM_EMAIL = undefined;
  envMock.JSM_API_TOKEN = undefined;
  envMock.M365_TENANT_ID = undefined;
  envMock.M365_CLIENT_ID = undefined;
  envMock.M365_CLIENT_SECRET = undefined;
  envMock.API_BASE_URL = undefined;
}

resetEnvMock();

jest.mock("../../main", () => {
  // Return a Proxy that reads from the mutable envMock object
  const actual = jest.requireActual("../../main");
  return {
    ...actual,
    env: new Proxy(envMock, {
      get(target, prop: string) {
        return target[prop];
      },
      ownKeys() {
        return Reflect.ownKeys(envMock);
      },
      getOwnPropertyDescriptor() {
        return { configurable: true, enumerable: true };
      },
    }),
  };
});

jest.mock("@sentry/node", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock("pino", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return jest.fn(() => mockLogger);
});

jest.mock("dotenv/config", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
  resetEnvMock();
});

describe("stripeReconcile", () => {
  it("returns error when STRIPE_SECRET_KEY not configured", async () => {
    const { stripeReconcile } = await import("../../tasks/stripe-reconcile");
    const result = await stripeReconcile({});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("STRIPE_SECRET_KEY");
  });
});

describe("jiraSync", () => {
  it("returns error when JIRA credentials not configured", async () => {
    const { jiraSync } = await import("../../tasks/jira-sync");
    const result = await jiraSync({});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("JIRA");
  });
});

describe("jsmSync", () => {
  it("returns error when JSM credentials not configured", async () => {
    const { jsmSync } = await import("../../tasks/jsm-sync");
    const result = await jsmSync({});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("JSM");
  });
});

describe("m365CalendarSync", () => {
  it("returns error when M365 credentials not configured", async () => {
    const { m365CalendarSync } = await import("../../tasks/m365-calendar-sync");
    const result = await m365CalendarSync({});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("M365");
  });
});

describe("scheduledNotifications", () => {
  it("returns error for unknown notification type", async () => {
    const { scheduledNotifications } =
      await import("../../tasks/scheduled-notifications");
    const result = await scheduledNotifications({ type: "invalid-type" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown notification type");
  });

  it("returns error when targetUserId missing for membership notification", async () => {
    const { scheduledNotifications } =
      await import("../../tasks/scheduled-notifications");
    const result = await scheduledNotifications({
      type: "membership-approved",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("targetUserId");
  });

  it("returns error when targetUserId missing for custom notification", async () => {
    const { scheduledNotifications } =
      await import("../../tasks/scheduled-notifications");
    const result = await scheduledNotifications({
      type: "custom",
      title: "Test",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("targetUserId");
  });

  it("returns error when title missing for custom notification", async () => {
    const { scheduledNotifications } =
      await import("../../tasks/scheduled-notifications");
    const result = await scheduledNotifications({
      type: "custom",
      targetUserId: "u1",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("title");
  });
});
