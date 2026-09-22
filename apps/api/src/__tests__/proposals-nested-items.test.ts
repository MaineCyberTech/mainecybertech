import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import proposalsRouter from "../routes/proposals";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/proposals", proposalsRouter);
app.use(errorHandler);

describe("proposals create — nested phase items", () => {
  beforeEach(() => jest.clearAllMocks());

  it("links nested line items to the phase they were declared under", async () => {
    const inserts: Record<string, any> = {};
    let phaseInsertCount = 0;

    const from = jest.fn((table: string) => {
      const builder = createMockBuilder({ data: null as unknown, error: null });
      (builder as any).insert = jest.fn((payload: unknown) => {
        (inserts[table] ??= []).push(payload);
        return builder;
      });
      (builder as any).select = jest.fn(() => {
        (builder as any).single = jest.fn(() =>
          Promise.resolve({
            data:
              table === "proposal_phases"
                ? { id: `phase-${++phaseInsertCount}` }
                : { id: "proposal-1" },
            error: null,
          }),
        );
        return builder;
      });
      return builder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
      },
    });

    const res = await request(app)
      .post("/api/v1/proposals")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        title: "Nested items",
        phases: [
          {
            title: "Phase A",
            items: [{ name: "Item A", quantity: 2, unitPrice: 100 }],
          },
          {
            title: "Phase B",
            items: [{ name: "Item B", quantity: 1, unitPrice: 50 }],
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(inserts.proposal_phases).toHaveLength(2);
    expect(inserts.proposal_line_items).toHaveLength(2);
    expect(inserts.proposal_line_items[0]).toMatchObject({ phase_id: "phase-1", name: "Item A" });
    expect(inserts.proposal_line_items[1]).toMatchObject({ phase_id: "phase-2", name: "Item B" });
  });
});
