import { jest } from "@jest/globals";
import express from "express";

export type MockResult = {
  data: unknown;
  error: unknown;
  count?: number;
};

export function createMockBuilder(result: MockResult) {
  const chain = () => builder;

  const builder = {
    select: jest.fn(chain),
    insert: jest.fn(chain),
    update: jest.fn(chain),
    delete: jest.fn(chain),
    order: jest.fn(chain),
    eq: jest.fn(chain),
    in: jest.fn(chain),
    is: jest.fn(chain),
    range: jest.fn(chain),
    single: jest.fn(chain),
    neq: jest.fn(chain),
    gte: jest.fn(chain),
    lte: jest.fn(chain),
    filter: jest.fn(chain),
    not: jest.fn(chain),
    ilike: jest.fn(chain),
    or: jest.fn(chain),
    limit: jest.fn(chain),
    maybeSingle: jest.fn(chain),
    rpc: jest.fn(chain),
    upsert: jest.fn(chain),
    then(onfulfilled?: (v: MockResult) => unknown, onrejected?: (v: unknown) => unknown) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };

  return builder;
}

/**
 * QW-1 stub for `../middleware/org-access` used by route-level suites. It is a
 * pass-through `next()` like the legacy stub, BUT it also populates the
 * `req.orgScope` / `req.orgId` fields that the new ownership checks
 * (`lib/tenant.ts`) read. Without this, a green route suite would not actually
 * exercise the tenant-isolation gate. `requireOrgAccess` additionally injects
 * `req.query.organization_id` to mirror production behaviour for handlers that
 * still scope via that legacy field.
 */
export function createOrgAccessStub(
  orgId: string,
  opts: { platformAdmin?: boolean } = {},
) {
  const platformAdmin = opts.platformAdmin ?? false;
  return {
    requireOrgAccess: (_req: any, _res: unknown, next: () => void) => {
      _req.orgScope = {
        orgId,
        explicit: true,
        platformAdmin,
        impersonation: false,
      };
      _req.orgId = orgId;
      _req.query = { ..._req.query, organization_id: orgId };
      next();
    },
    requireOrgAccessByParam: (req: any, _res: unknown, next: () => void) => {
      req.orgScope = {
        orgId: req.params?.id ?? null,
        explicit: true,
        platformAdmin,
        impersonation: false,
      };
      req.orgId = req.params?.id ?? null;
      next();
    },
  };
}

export function createTestApp() {
  const app = express();
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  return app;
}

/**
 * Fixture rows served to auth/permission middleware so route tests exercise
 * the REAL requireOrgAccess/requirePermission chain (test-mode bypasses were
 * removed for security) without each suite re-mocking membership lookups.
 */
export const MIDDLEWARE_TABLES = ["profiles", "memberships", "subscriptions"];

export function tableAwareFrom(routeBuilder: ReturnType<typeof createMockBuilder>) {
  return (table: string) => {
    if (table === "profiles") {
      return createMockBuilder({ data: [{ is_super_admin: true }], error: null });
    }
    if (table === "memberships") {
      return createMockBuilder({
        data: [
          {
            id: "membership-1",
            user_id: "user-1",
            organization_id: "00000000-0000-0000-0000-000000000001",
            role_id: "role-1",
            status: "approved",
            roles: [{ id: "role-1", key: "super_admin" }],
          },
        ],
        error: null,
      });
    }
    if (table === "subscriptions") {
      return createMockBuilder({
        data: [
          {
            id: "subscription-1",
            organization_id: "00000000-0000-0000-0000-000000000001",
            status: "active",
            plan: "pro",
            current_period_end: "2027-12-31T23:59:59Z",
          },
        ],
        error: null,
      });
    }
    return routeBuilder;
  };
}
