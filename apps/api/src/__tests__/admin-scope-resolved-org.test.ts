import { jest } from "@jest/globals";

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import { applyResolvedOrg } from "../lib/admin-scope";

/**
 * MT-P2-002: the legacy `if (orgId)` by-id filter fails open when the org gate
 * is not reached. `applyResolvedOrg` makes the predicate mandatory: it narrows
 * to the resolved/explicit org and fails closed (403) when neither exists.
 */

const ORG_A = "00000000-0000-0000-0000-00000000000a";

function makeReq(overrides: Record<string, unknown> = {}) {
  return { query: {}, body: undefined, ...overrides } as never;
}

function makeQuery() {
  const query = { eq: jest.fn(() => query) };
  return query;
}

describe("applyResolvedOrg (MT-P2-002)", () => {
  it("applies the resolved org as a mandatory predicate", () => {
    const query = makeQuery();
    const result = applyResolvedOrg(makeReq({ orgId: ORG_A }), query);

    expect(result).toBe(query);
    expect(query.eq).toHaveBeenCalledWith("organization_id", ORG_A);
  });

  it("honours an explicit query or body org when no scope was resolved", () => {
    const fromQuery = makeQuery();
    applyResolvedOrg(makeReq({ query: { organization_id: ORG_A } }), fromQuery);
    expect(fromQuery.eq).toHaveBeenCalledWith("organization_id", ORG_A);

    const fromBody = makeQuery();
    applyResolvedOrg(makeReq({ body: { organizationId: ORG_A } }), fromBody);
    expect(fromBody.eq).toHaveBeenCalledWith("organization_id", ORG_A);
  });

  it("fails closed with a 403 when no org predicate can be resolved", () => {
    const query = makeQuery();

    expect(() => applyResolvedOrg(makeReq(), query)).toThrow(/organization scope/i);
    expect(query.eq).not.toHaveBeenCalled();
  });

  it("leaves an org-agnostic platform admin unscoped (audited by the gate)", () => {
    const query = makeQuery();
    const result = applyResolvedOrg(
      makeReq({ orgScope: { orgId: null, explicit: false, platformAdmin: true } }),
      query,
    );

    expect(result).toBe(query);
    expect(query.eq).not.toHaveBeenCalled();
  });

  it("still scopes a platform admin who supplied an explicit org", () => {
    const query = makeQuery();
    applyResolvedOrg(makeReq({ orgId: ORG_A }), query);

    expect(query.eq).toHaveBeenCalledWith("organization_id", ORG_A);
  });
});
