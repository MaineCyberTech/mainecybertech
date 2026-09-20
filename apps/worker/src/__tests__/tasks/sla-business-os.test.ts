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

jest.mock("../../env", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  },
}));

function createThenableChain(initialResult: unknown) {
  let result = initialResult;
  const chain: Record<string, jest.Mock> = {};
  const chainedMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "lt",
    "lte",
    "gte",
    "gt",
    "not",
    "or",
    "order",
    "range",
    "limit",
    "single",
    "maybeSingle",
  ];
  for (const m of chainedMethods) {
    chain[m] = jest.fn().mockReturnThis();
  }
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  chain._setResult = (r: unknown) => {
    result = r;
  };
  return chain;
}

let currentChain: ReturnType<typeof createThenableChain>;

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => currentChain),
  })),
}));

import {
  slaLogCheck,
  businessOsSnapshot,
  automationRunCheck,
  approvalOverdueCheck,
  vendorContractRenewalCheck,
} from "../../tasks/module-tasks";

describe("slaLogCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when no tickets to evaluate", async () => {
    const result = await slaLogCheck({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when ticket fetch fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Fetch failed" } });
    const result = await slaLogCheck({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Failed to fetch tickets: Fetch failed");
  });

  it("returns { ok: true } when tickets exist and logs are inserted", async () => {
    const created = new Date(Date.now() - 3600_000).toISOString();
    currentChain._setResult({
      data: [
        {
          id: "t1",
          organization_id: "o1",
          created_at: created,
          updated_at: created,
          status: "open",
        },
      ],
      error: null,
    });
    const result = await slaLogCheck({});
    expect(result.ok).toBe(true);
  });
});

describe("businessOsSnapshot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when aggregates computed", async () => {
    const result = await businessOsSnapshot({});
    expect(result.ok).toBe(true);
  });

  it("returns { ok: false } when organization fetch fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Org fetch failed" } });
    const result = await businessOsSnapshot({});
    expect(result.ok).toBe(false);
  });
});

describe("automationRunCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when no active workflows", async () => {
    const result = await automationRunCheck({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when workflow fetch fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Fetch failed" } });
    const result = await automationRunCheck({});
    expect(result.ok).toBe(false);
  });
});

describe("approvalOverdueCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when no overdue approvals", async () => {
    const result = await approvalOverdueCheck({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when approval fetch fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Fetch failed" } });
    const result = await approvalOverdueCheck({});
    expect(result.ok).toBe(false);
  });

  it("notifies the assignee for an overdue approval", async () => {
    currentChain._setResult({
      data: [
        {
          id: "ap-1",
          organization_id: "org-1",
          request_subject: "Approve firewall change",
          due_at: "2020-01-01T00:00:00Z",
          status: "pending",
          assigned_to: "user-9",
          requested_by: "user-1",
        },
      ],
      error: null,
    });
    const result = await approvalOverdueCheck({});
    expect(result).toEqual({ ok: true });
    expect(currentChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-9", module: "approvals", action: "overdue" }),
    );
  });
});

describe("vendorContractRenewalCheck", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentChain = createThenableChain({ data: [], error: null });
  });

  it("returns { ok: true } when there are no upcoming renewals", async () => {
    const result = await vendorContractRenewalCheck({});
    expect(result).toEqual({ ok: true });
  });

  it("returns { ok: false } when the contract fetch fails", async () => {
    currentChain._setResult({ data: null, error: { message: "Fetch failed" } });
    const result = await vendorContractRenewalCheck({});
    expect(result.ok).toBe(false);
  });

  it("notifies the contract owner about an upcoming renewal", async () => {
    currentChain._setResult({
      data: [
        {
          id: "vc-1",
          organization_id: "org-1",
          vendor_name: "Acme",
          service_name: "Backup",
          renewal_date: "2026-10-01",
          owner_user_id: "user-5",
        },
      ],
      error: null,
    });
    const result = await vendorContractRenewalCheck({});
    expect(result).toEqual({ ok: true });
    expect(currentChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-5",
        module: "vendor-contracts",
        action: "renewal-due",
      }),
    );
  });
});
