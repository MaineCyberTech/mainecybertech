import {
  getAlgaPsaIntakeConfig,
  readAlgaPsaIntakeConfig,
  type AlgaPsaIntakeConfig,
} from "@/lib/alga-psa/config";

const BASE_ENV = {
  ALGA_PSA_INTAKE_ENABLED: "true",
  ALGA_PSA_BASE_URL: "https://psa.example.test/api/v1/",
  ALGA_PSA_API_KEY: "test-api-key-never-log",
  ALGA_PSA_CLIENT_ID: "11111111-1111-4111-8111-111111111111",
  ALGA_PSA_BOARD_ID: "22222222-2222-4222-8222-222222222222",
  ALGA_PSA_STATUS_ID: "33333333-3333-4333-8333-333333333333",
  ALGA_PSA_PRIORITY_ID: "44444444-4444-4444-8444-444444444444",
} as NodeJS.ProcessEnv;

describe("Alga PSA intake configuration", () => {
  it("is disabled by default", () => {
    const status = readAlgaPsaIntakeConfig({});

    expect(status).toEqual({
      enabled: false,
      config: null,
      missing: [],
      invalid: [],
      reason: "disabled",
    });
    expect(getAlgaPsaIntakeConfig("55555555-5555-4555-8555-555555555555", {})).toBeNull();
  });

  it("stays disabled unless the flag is exactly true", () => {
    expect(readAlgaPsaIntakeConfig({ ...BASE_ENV, ALGA_PSA_INTAKE_ENABLED: "false" }).enabled).toBe(
      false,
    );
    expect(readAlgaPsaIntakeConfig({ ...BASE_ENV, ALGA_PSA_INTAKE_ENABLED: "1" }).enabled).toBe(
      false,
    );
  });

  it("resolves a complete configuration and normalizes the base URL", () => {
    const config = getAlgaPsaIntakeConfig(undefined, BASE_ENV) as AlgaPsaIntakeConfig;

    expect(config).toEqual({
      baseUrl: "https://psa.example.test/api/v1",
      apiKey: "test-api-key-never-log",
      clientId: "11111111-1111-4111-8111-111111111111",
      boardId: "22222222-2222-4222-8222-222222222222",
      statusId: "33333333-3333-4333-8333-333333333333",
      priorityId: "44444444-4444-4444-8444-444444444444",
      priorityMap: null,
    });
  });

  it("parses a complete portal-priority map", () => {
    const env = {
      ...BASE_ENV,
      ALGA_PSA_PRIORITY_MAP: JSON.stringify({
        low: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        normal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        high: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        urgent: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      }),
    };

    expect(getAlgaPsaIntakeConfig(undefined, env)?.priorityMap).toEqual({
      low: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      normal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      high: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      urgent: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
  });

  it("fails closed when the priority map is partial, unknown-keyed, or malformed", () => {
    const partial = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_PRIORITY_MAP: JSON.stringify({ high: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }),
    });
    expect(partial.enabled).toBe(false);
    expect(partial.reason).toBe("invalid");
    expect(partial.invalid).toEqual(["ALGA_PSA_PRIORITY_MAP"]);

    const unknownKey = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_PRIORITY_MAP: JSON.stringify({
        low: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        normal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        high: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        critical: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      }),
    });
    expect(unknownKey.enabled).toBe(false);
    expect(unknownKey.invalid).toEqual(["ALGA_PSA_PRIORITY_MAP"]);

    const malformed = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_PRIORITY_MAP: "{not-json",
    });
    expect(malformed.enabled).toBe(false);
    expect(malformed.invalid).toEqual(["ALGA_PSA_PRIORITY_MAP"]);
  });

  it("reports missing names, never values, when required settings are absent", () => {
    const status = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_API_KEY: "",
      ALGA_PSA_BOARD_ID: "",
    });

    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("incomplete");
    expect(status.missing).toEqual(["ALGA_PSA_API_KEY", "ALGA_PSA_BOARD_ID"]);
    expect(JSON.stringify(status)).not.toContain(BASE_ENV.ALGA_PSA_API_KEY);
  });

  it("rejects malformed UUIDs and non-http base URLs", () => {
    const status = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_BASE_URL: "ftp://psa.example.test",
      ALGA_PSA_BOARD_ID: "not-a-uuid",
    });

    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("invalid");
    expect(status.invalid).toEqual(["ALGA_PSA_BASE_URL", "ALGA_PSA_BOARD_ID"]);
  });

  it("rejects a base URL that omits the /api/v1 path", () => {
    const status = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_BASE_URL: "https://psa.example.test",
    });

    expect(status.enabled).toBe(false);
    expect(status.invalid).toEqual(["ALGA_PSA_BASE_URL"]);
  });

  it("uses the explicit per-org client map and refuses unmapped tenants", () => {
    const env = {
      ...BASE_ENV,
      ALGA_PSA_CLIENT_MAP: JSON.stringify({
        "55555555-5555-4555-8555-555555555555": "99999999-9999-4999-8999-999999999999",
      }),
    };

    expect(getAlgaPsaIntakeConfig("55555555-5555-4555-8555-555555555555", env)?.clientId).toBe(
      "99999999-9999-4999-8999-999999999999",
    );
    expect(getAlgaPsaIntakeConfig("77777777-7777-4777-8777-777777777777", env)).toBeNull();
  });

  it("fails closed when the per-org client map is malformed", () => {
    const status = readAlgaPsaIntakeConfig({
      ...BASE_ENV,
      ALGA_PSA_CLIENT_MAP: "{not-json",
    });

    expect(status.enabled).toBe(false);
    expect(status.reason).toBe("invalid");
    expect(status.invalid).toEqual(["ALGA_PSA_CLIENT_MAP"]);
  });
});
