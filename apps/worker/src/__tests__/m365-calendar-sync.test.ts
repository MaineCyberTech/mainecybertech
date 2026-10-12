import { jest } from "@jest/globals";

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

jest.mock("../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    M365_TENANT_ID: "tenant-1",
    M365_CLIENT_ID: "client-1",
    M365_CLIENT_SECRET: "secret-1",
  },
}));

jest.mock("../services/supabase", () => ({ wsTransport: undefined }));

type TaskRow = {
  id: string;
  title: string;
  due_at: string | null;
  m365_event_id?: string | null;
};

function makeSupabase(tasks: TaskRow[]) {
  const updateCalls: Array<Record<string, unknown>> = [];
  const client = {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: tasks, error: null }),
      update: jest.fn((values: Record<string, unknown>) => {
        updateCalls.push(values);
        return { eq: jest.fn().mockResolvedValue({ error: null }) };
      }),
    })),
  };
  return { client, updateCalls };
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@supabase/supabase-js";
import { m365CalendarSync } from "../tasks/m365-calendar-sync";

const fetchMock = jest.fn() as unknown as jest.Mock;
const originalFetch = global.fetch;

const task: TaskRow = {
  id: "t1",
  title: "Do it",
  due_at: "2026-09-01T10:00:00.000Z",
  m365_event_id: null,
};

const payload = {
  projectId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  userPrincipalName: "tasks@example.com",
};

describe("m365CalendarSync idempotency (API-P3-006)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function mockToken() {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ access_token: "tok" }),
    });
  }

  it("creates the event once and persists the Graph event id", async () => {
    const { client, updateCalls } = makeSupabase([{ ...task }]);
    (createClient as unknown as jest.Mock).mockReturnValue(client);
    mockToken();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: "evt-1" }),
    });

    const result = await m365CalendarSync(payload);

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[1] as [string, { method: string }];
    expect(url).toBe("https://graph.microsoft.com/v1.0/users/tasks%40example.com/events");
    expect(init.method).toBe("POST");
    expect(updateCalls).toEqual([{ m365_event_id: "evt-1" }]);
  });

  it("PATCHes the stored event on a re-run instead of creating a duplicate", async () => {
    const { client, updateCalls } = makeSupabase([{ ...task, m365_event_id: "evt-1" }]);
    (createClient as unknown as jest.Mock).mockReturnValue(client);
    mockToken();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ id: "evt-1" }),
    });

    const result = await m365CalendarSync(payload);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, { method: string }];
    expect(url).toBe("https://graph.microsoft.com/v1.0/users/tasks%40example.com/events/evt-1");
    expect(init.method).toBe("PATCH");
    // The id is unchanged, so no write is needed.
    expect(updateCalls).toHaveLength(0);
  });

  it("recreates the event when the stored Graph event is gone (404)", async () => {
    const { client, updateCalls } = makeSupabase([{ ...task, m365_event_id: "evt-old" }]);
    (createClient as unknown as jest.Mock).mockReturnValue(client);
    mockToken();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({}),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: "evt-new" }),
    });

    const result = await m365CalendarSync(payload);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect((fetchMock.mock.calls[1][1] as { method: string }).method).toBe("PATCH");
    expect((fetchMock.mock.calls[2][1] as { method: string }).method).toBe("POST");
    expect(updateCalls).toEqual([{ m365_event_id: "evt-new" }]);
  });
});
