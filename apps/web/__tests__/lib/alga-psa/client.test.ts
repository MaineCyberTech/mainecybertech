import { jest } from "@jest/globals";
import {
  ALGA_PSA_EXTERNAL_SYSTEM,
  AlgaPsaError,
  createIntakeTicket,
  ensureIntakeTicket,
  findIntakeTicket,
  resolvePriorityId,
  type AlgaPsaIntakeConfig,
} from "@/lib/alga-psa/client";

const CONFIG: AlgaPsaIntakeConfig = {
  baseUrl: "https://psa.example.test/api/v1",
  apiKey: "test-api-key-never-log",
  clientId: "11111111-1111-4111-8111-111111111111",
  boardId: "22222222-2222-4222-8222-222222222222",
  statusId: "33333333-3333-4333-8333-333333333333",
  priorityId: "44444444-4444-4444-8444-444444444444",
};

function response(body: unknown, status = 201): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

function baseInput() {
  return {
    config: CONFIG,
    title: "Printer is offline",
    description: "The office printer stopped responding after lunch.",
    portalOrganizationId: "55555555-5555-4555-8555-555555555555",
    portalPriority: "high",
    portalCategory: "hardware",
    portalBaseUrl: "https://app.example.test",
  };
}

describe("createIntakeTicket", () => {
  it("creates an Alga ticket with required fields and a portal origin link", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response({
        data: { ticket_id: "psa-ticket-1", ticket_number: "T-1042", title: "Printer is offline" },
      }),
    );

    const result = await createIntakeTicket(
      { ...baseInput(), externalId: "66666666-6666-4666-8666-666666666666" },
      fetchMock as unknown as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://psa.example.test/api/v1/tickets");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      accept: "application/json",
      "x-api-key": CONFIG.apiKey,
    });

    const body = JSON.parse(String(init.body)) as {
      title: string;
      board_id: string;
      client_id: string;
      status_id: string;
      priority_id: string;
      attributes: Record<string, unknown>;
      external_links: Array<Record<string, unknown>>;
    };

    expect(body).toMatchObject({
      title: "Printer is offline",
      board_id: CONFIG.boardId,
      client_id: CONFIG.clientId,
      status_id: CONFIG.statusId,
      priority_id: CONFIG.priorityId,
    });
    expect(body).not.toHaveProperty("description");
    expect(url).not.toMatch(/\/comments$/);
    expect(body.attributes).toMatchObject({
      description: "The office printer stopped responding after lunch.",
      portal_organization_id: "55555555-5555-4555-8555-555555555555",
      portal_priority: "high",
      portal_category: "hardware",
      portal_external_id: "66666666-6666-4666-8666-666666666666",
    });
    expect(body.attributes.portal_submitted_at).toEqual(expect.any(String));

    expect(body.external_links).toHaveLength(1);
    expect(body.external_links[0]).toMatchObject({
      system: ALGA_PSA_EXTERNAL_SYSTEM,
      external_id: "66666666-6666-4666-8666-666666666666",
      relationship: "origin",
      realm: "55555555-5555-4555-8555-555555555555",
      url: "https://app.example.test/portal/support",
      metadata: {
        portal_organization_id: "55555555-5555-4555-8555-555555555555",
        portal_priority: "high",
        portal_category: "hardware",
      },
    });
    expect(ALGA_PSA_EXTERNAL_SYSTEM).toBe("client_portal");
    expect(result).toEqual({
      id: "psa-ticket-1",
      number: "T-1042",
      title: "Printer is offline",
    });
  });

  it("uses the canonical attributes.description field and makes no extra comment call", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        response({ data: { ticket_id: "psa-ticket-1b", title: "Printer is offline" } }),
      );

    await createIntakeTicket(baseInput(), fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      description?: unknown;
      attributes: { description?: unknown };
      external_links: Array<{ system: string }>;
    };

    expect(url).toBe("https://psa.example.test/api/v1/tickets");
    expect(body.description).toBeUndefined();
    expect(body.attributes.description).toBe("The office printer stopped responding after lunch.");
    expect(body.external_links[0]?.system).toBe("client_portal");
  });

  it("generates a UUID external id when the caller does not supply one", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ data: { ticket_id: "psa-ticket-2" } }));

    await createIntakeTicket(baseInput(), fetchMock as unknown as typeof fetch);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      external_links: Array<{ external_id: string }>;
    };
    expect(body.external_links[0]?.external_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("throws a safe error on a non-2xx response and never includes the API key", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response(
        {
          error: {
            code: "system_not_found",
            message: "Unknown external system 'client_portal'",
          },
        },
        422,
      ),
    );

    const error = await createIntakeTicket(baseInput(), fetchMock as unknown as typeof fetch).catch(
      (err: unknown) => err,
    );

    expect(error).toBeInstanceOf(AlgaPsaError);
    expect(error).toMatchObject({ status: 422, code: "system_not_found" });
    expect(String((error as Error).message)).toMatch(/HTTP 422/);
    expect(String((error as Error).message)).not.toContain(CONFIG.apiKey);
  });

  it("throws when a successful response carries no ticket id", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ data: { ticket_number: "T-1" } }));

    await expect(
      createIntakeTicket(baseInput(), fetchMock as unknown as typeof fetch),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("maps a network failure to a 502 without leaking the request", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(
      createIntakeTicket(baseInput(), fetchMock as unknown as typeof fetch),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("uses the per-portal-priority PSA id when a priority map is configured", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ data: { ticket_id: "psa-ticket-map" } }));
    const config: AlgaPsaIntakeConfig = {
      ...CONFIG,
      priorityMap: {
        low: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        normal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        high: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        urgent: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      },
    };

    await createIntakeTicket({ ...baseInput(), config }, fetchMock as unknown as typeof fetch);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { priority_id: string };
    expect(body.priority_id).toBe("cccccccc-cccc-4ccc-8ccc-cccccccccccc");
    expect(resolvePriorityId(config, "urgent")).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    expect(resolvePriorityId(config, "unknown")).toBe(CONFIG.priorityId);
    expect(resolvePriorityId(CONFIG, "high")).toBe(CONFIG.priorityId);
  });
});

describe("findIntakeTicket", () => {
  it("returns null only for a definitive 404", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ error: {} }, 404));

    await expect(
      findIntakeTicket(
        { config: CONFIG, externalId: "66666666-6666-4666-8666-666666666666" },
        fetchMock as unknown as typeof fetch,
      ),
    ).resolves.toBeNull();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/tickets/by-external-link?");
    expect(url).toContain(`system=${ALGA_PSA_EXTERNAL_SYSTEM}`);
    expect(url).toContain("external_id=66666666-6666-4666-8666-666666666666");
  });

  it("returns the ticket id when the external link already exists", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        response({ data: { ticket_id: "psa-ticket-existing", link: { system: "client_portal" } } }),
      );

    await expect(
      findIntakeTicket(
        { config: CONFIG, externalId: "66666666-6666-4666-8666-666666666666" },
        fetchMock as unknown as typeof fetch,
      ),
    ).resolves.toEqual({ id: "psa-ticket-existing", number: null, title: null });
  });

  it("throws on an upstream error instead of treating it as not found", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ error: { code: "UNAUTHORIZED" } }, 401));

    await expect(
      findIntakeTicket(
        { config: CONFIG, externalId: "66666666-6666-4666-8666-666666666666" },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("maps a lookup network failure to a 502", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED"));

    await expect(
      findIntakeTicket(
        { config: CONFIG, externalId: "66666666-6666-4666-8666-666666666666" },
        fetchMock as unknown as typeof fetch,
      ),
    ).rejects.toMatchObject({ status: 502 });
  });
});

describe("ensureIntakeTicket", () => {
  const externalId = "66666666-6666-4666-8666-666666666666";

  it("returns the existing ticket and does not create a duplicate", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(response({ data: { ticket_id: "psa-ticket-existing" } }));

    const result = await ensureIntakeTicket(
      { ...baseInput(), externalId },
      fetchMock as unknown as typeof fetch,
    );

    expect(result.id).toBe("psa-ticket-existing");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/tickets/by-external-link?");
    expect(init.method).toBe("GET");
  });

  it("creates only after a definitive 404", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response({ error: {} }, 404))
      .mockResolvedValueOnce(response({ data: { ticket_id: "psa-ticket-new" } }, 201));

    const result = await ensureIntakeTicket(
      { ...baseInput(), externalId },
      fetchMock as unknown as typeof fetch,
    );

    expect(result.id).toBe("psa-ticket-new");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, createInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(createInit.method).toBe("POST");
    const body = JSON.parse(String(createInit.body)) as {
      external_links: Array<{ external_id: string }>;
    };
    expect(body.external_links[0]?.external_id).toBe(externalId);
  });

  it("fails closed when the pre-create lookup cannot be verified", async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({ error: { code: "UNKNOWN" } }, 500));

    await expect(
      ensureIntakeTicket({ ...baseInput(), externalId }, fetchMock as unknown as typeof fetch),
    ).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves a create race by looking up the winning ticket on 409", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(response({ error: {} }, 404))
      .mockResolvedValueOnce(response({ error: { code: "duplicate_external_link" } }, 409))
      .mockResolvedValueOnce(response({ data: { ticket_id: "psa-ticket-race-winner" } }));

    const result = await ensureIntakeTicket(
      { ...baseInput(), externalId },
      fetchMock as unknown as typeof fetch,
    );

    expect(result.id).toBe("psa-ticket-race-winner");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
