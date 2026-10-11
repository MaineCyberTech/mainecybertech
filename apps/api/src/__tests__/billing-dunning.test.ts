import { jest } from "@jest/globals";
import { createMockBuilder, type MockResult } from "./helpers";

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../lib/notify", () => ({ notifyAndEmail: jest.fn() }));
jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { notifyAndEmail } from "../lib/notify";
import {
  notifyBillingPaymentFailure,
  resolveBillingRecipients,
} from "../lib/billing-dunning";

/** Minimal thenable Supabase stand-in keyed by table. */
function mockSupabase(tables: Record<string, MockResult>) {
  const builders: Record<string, any[]> = {};
  const supabase = {
    from: jest.fn((table: string) => {
      const builder = createMockBuilder(tables[table] ?? { data: [], error: null });
      (builders[table] ??= []).push(builder);
      return builder;
    }),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return { supabase, builders };
}

const INVOICE = {
  id: "in_fail",
  number: "INV-2002",
  total: 5000,
  currency: "usd",
};

describe("billing dunning notifications (BILL-P2-004)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves billing contacts from billing-granted roles and admin bypass", async () => {
    mockSupabase({
      memberships: {
        data: [
          { user_id: "u-billing", role_id: "role-billing", roles: { key: "client-billing" } },
          { user_id: "u-admin", role_id: "role-admin", roles: { key: "admin" } },
          { user_id: "u-member", role_id: "role-member", roles: { key: "client_user" } },
        ],
        error: null,
      },
      role_permissions: {
        data: [{ role_id: "role-billing", permissions: { module_key: "billing" } }],
        error: null,
      },
      profiles: {
        data: [
          { id: "u-billing", email: "ap@acme.example" },
          { id: "u-admin", email: "admin@acme.example" },
        ],
        error: null,
      },
    });

    const recipients = await resolveBillingRecipients("org-1");

    expect(recipients).toEqual([
      { userId: "u-billing", email: "ap@acme.example" },
      { userId: "u-admin", email: "admin@acme.example" },
    ]);
  });

  it("notifies every billing contact on a failed payment", async () => {
    mockSupabase({
      memberships: {
        data: [
          { user_id: "u-billing", role_id: "role-billing", roles: { key: "client-billing" } },
          { user_id: "u-admin", role_id: "role-admin", roles: { key: "admin" } },
        ],
        error: null,
      },
      role_permissions: {
        data: [{ role_id: "role-billing", permissions: { module_key: "billing" } }],
        error: null,
      },
      profiles: {
        data: [
          { id: "u-billing", email: "ap@acme.example" },
          { id: "u-admin", email: "admin@acme.example" },
        ],
        error: null,
      },
    });

    const result = await notifyBillingPaymentFailure({
      organizationId: "org-1",
      invoice: INVOICE,
    });

    expect(result).toEqual({ notified: 2, recipients: 2 });
    expect(notifyAndEmail).toHaveBeenCalledTimes(2);
    expect(notifyAndEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u-billing",
        organizationId: "org-1",
        module: "billing",
        moduleId: "in_fail",
        action: "payment_failed",
        email: "ap@acme.example",
      }),
    );
    const firstCall = (notifyAndEmail as jest.Mock).mock.calls[0][0] as {
      title: string;
      body: string;
    };
    expect(firstCall.title).toBe("Payment failed");
    expect(firstCall.body).toContain("INV-2002");
    expect(firstCall.body).toContain("50.00 USD");
  });

  it("does not notify when the org has no billing contacts", async () => {
    mockSupabase({
      memberships: {
        data: [{ user_id: "u-member", role_id: "role-member", roles: { key: "client_user" } }],
        error: null,
      },
      role_permissions: { data: [], error: null },
    });

    const result = await notifyBillingPaymentFailure({
      organizationId: "org-1",
      invoice: INVOICE,
    });

    expect(result).toEqual({ notified: 0, recipients: 0 });
    expect(notifyAndEmail).not.toHaveBeenCalled();
  });
});
