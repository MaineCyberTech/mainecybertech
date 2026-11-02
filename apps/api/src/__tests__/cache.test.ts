import request from "supertest";
import express from "express";
import { responseCache, responseCacheNoRenew, invalidateCache } from "../middleware/cache";

function createTestApp() {
  const app = express();
  let callCount = 0;

  app.get("/test", responseCache(60), (req, res) => {
    callCount++;
    res.json({ count: callCount, timestamp: Date.now() });
  });

  app.post("/test", (req, res) => {
    res.json({ ok: true });
  });

  return { app, getCallCount: () => callCount };
}

describe("responseCache", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("caches GET responses", async () => {
    const { app } = createTestApp();

    const res1 = await request(app).get("/test");
    const res2 = await request(app).get("/test");

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.headers["x-cache"]).toBe("MISS");
    expect(res2.headers["x-cache"]).toBe("HIT");
    expect(res1.body.count).toBe(res2.body.count);
  });

  it("does not cache POST responses", async () => {
    const app = express();
    let callCount = 0;

    app.use(express.json());
    app.post("/test", responseCache(60), (req, res) => {
      callCount++;
      res.json({ count: callCount });
    });

    await request(app).post("/test").send({});
    await request(app).post("/test").send({});

    expect(callCount).toBe(2);
  });

  it("invalidates cache on pattern match", async () => {
    const { app, getCallCount } = createTestApp();

    await request(app).get("/test");
    expect(getCallCount()).toBe(1);

    invalidateCache("/test");

    await request(app).get("/test");
    expect(getCallCount()).toBe(2);
  });

  it("does not self-renew on cache hit with responseCacheNoRenew", async () => {
    invalidateCache();
    const app = express();
    let callCount = 0;

    app.get("/no-renew", responseCacheNoRenew(60), (req, res) => {
      callCount++;
      res.json({ count: callCount });
    });

    const res1 = await request(app).get("/no-renew");
    expect(res1.body.count).toBe(1);
    expect(res1.headers["x-cache"]).toBe("MISS");

    const res2 = await request(app).get("/no-renew");
    expect(res2.body.count).toBe(1);
    expect(res2.headers["x-cache"]).toBe("HIT");
    expect(res2.body.count).toBe(res1.body.count);

    // Invalidate and verify handler runs again
    invalidateCache();

    const res3 = await request(app).get("/no-renew");
    expect(res3.body.count).toBe(2);
    expect(res3.headers["x-cache"]).toBe("MISS");
  });

  it("invalidates all cache when no pattern", async () => {
    const { app, getCallCount } = createTestApp();

    await request(app).get("/test");
    expect(getCallCount()).toBe(1);

    invalidateCache();

    await request(app).get("/test");
    expect(getCallCount()).toBe(2);
  });

  it("does not share cached responses between users in the same org", async () => {
    invalidateCache();
    const app = express();
    let callCount = 0;

    app.get(
      "/scoped",
      (req, _res, next) => {
        (req as unknown as { authUser: { userId: string } }).authUser = {
          userId: String(req.headers["x-user"] ?? "anonymous"),
        };
        (req as unknown as { orgId: string }).orgId = "org-1";
        next();
      },
      responseCacheNoRenew(60, { userScoped: true }),
      (_req, res) => {
        callCount++;
        res.json({ count: callCount });
      },
    );

    const alice1 = await request(app).get("/scoped").set("x-user", "alice");
    const bob1 = await request(app).get("/scoped").set("x-user", "bob");
    const alice2 = await request(app).get("/scoped").set("x-user", "alice");

    expect(alice1.body.count).toBe(1);
    expect(bob1.body.count).toBe(2);
    expect(alice2.body.count).toBe(1);
    expect(alice2.headers["x-cache"]).toBe("HIT");
    expect(bob1.headers["x-cache"]).toBe("MISS");
  });

  it("does not collide cache keys across mounted routers with the same relative path", async () => {
    invalidateCache();
    const app = express();
    const rolesRouter = express.Router();
    const orgsRouter = express.Router();

    rolesRouter.get("/", responseCacheNoRenew(60), (_req, res) => {
      res.json({ entity: "roles" });
    });
    orgsRouter.get("/", responseCacheNoRenew(60), (_req, res) => {
      res.json({ entity: "organizations" });
    });

    app.use("/api/v1/roles", rolesRouter);
    app.use("/api/v1/organizations", orgsRouter);

    const roles1 = await request(app).get("/api/v1/roles");
    const orgs1 = await request(app).get("/api/v1/organizations");
    // Second round must hit each router's own cache entry — not the other's.
    const roles2 = await request(app).get("/api/v1/roles");
    const orgs2 = await request(app).get("/api/v1/organizations");

    expect(roles1.body.entity).toBe("roles");
    expect(orgs1.body.entity).toBe("organizations");
    expect(roles2.body.entity).toBe("roles");
    expect(orgs2.body.entity).toBe("organizations");
    expect(roles2.headers["x-cache"]).toBe("HIT");
    expect(orgs2.headers["x-cache"]).toBe("HIT");
  });
});

/**
 * MT-P1-004 / CHAIN-P1-006: a response computed under a broad tenant scope
 * (all tenants) must never satisfy a request with a narrower resolved scope
 * that happens to share the same active org.
 */
describe("responseCache tenant scope", () => {
  const ORG = "00000000-0000-0000-0000-00000000000a";
  type Scope = { allTenants: boolean; orgIds: string[] };

  function createScopedApp(scopes: Record<string, Scope>) {
    const app = express();
    let callCount = 0;

    app.get(
      "/scoped",
      (req, _res, next) => {
        // Stand-in for requireAuth + requireOrgAccess: every caller is pinned
        // to the same active org, but resolves a different tenant scope.
        const userId = String(req.headers["x-test-user"] ?? "user");
        (req as unknown as { authUser: { userId: string; email: string } }).authUser = {
          userId,
          email: "test@example.com",
        };
        (req as unknown as { orgId: string }).orgId = ORG;
        next();
      },
      responseCache(60, {
        scope: (req) => {
          const userId = (req as unknown as { authUser: { userId: string } }).authUser.userId;
          return scopes[userId] ?? { allTenants: false, orgIds: [] };
        },
      }),
      (req, res) => {
        callCount++;
        const userId = (req as unknown as { authUser: { userId: string } }).authUser.userId;
        res.json({
          viewer: userId,
          allTenants: scopes[userId]?.allTenants ?? false,
          call: callCount,
        });
      },
    );

    return { app, getCallCount: () => callCount };
  }

  beforeEach(() => {
    invalidateCache();
  });

  it("does not share an all-tenant entry with a narrower-scoped caller on the same org", async () => {
    const { app, getCallCount } = createScopedApp({
      "platform-admin": { allTenants: true, orgIds: [] },
      "org-member": { allTenants: false, orgIds: [ORG] },
    });

    const platform = await request(app).get("/scoped").set("x-test-user", "platform-admin");
    expect(platform.status).toBe(200);
    expect(platform.body.allTenants).toBe(true);
    expect(platform.headers["x-cache"]).toBe("MISS");

    // Same active org, narrower membership set: must not reuse the all-tenant
    // entry (the cross-tenant aggregate disclosure).
    const member = await request(app).get("/scoped").set("x-test-user", "org-member");
    expect(member.status).toBe(200);
    expect(member.body.allTenants).toBe(false);
    expect(member.headers["x-cache"]).toBe("MISS");
    expect(getCallCount()).toBe(2);

    // ...and the org-scoped entry is not served back to the platform admin.
    const platformAgain = await request(app).get("/scoped").set("x-test-user", "platform-admin");
    expect(platformAgain.body.allTenants).toBe(true);
    expect(platformAgain.headers["x-cache"]).toBe("HIT");
  });

  it("still shares an entry between callers with the same resolved scope", async () => {
    const { app, getCallCount } = createScopedApp({
      "member-a": { allTenants: false, orgIds: [ORG] },
      "member-b": { allTenants: false, orgIds: [ORG] },
    });

    await request(app).get("/scoped").set("x-test-user", "member-a");
    const second = await request(app).get("/scoped").set("x-test-user", "member-b");
    expect(second.headers["x-cache"]).toBe("HIT");
    expect(getCallCount()).toBe(1);
  });

  it("bypasses the shared cache when the scope cannot be resolved", async () => {
    const app = express();
    let callCount = 0;

    app.get(
      "/failing-scope",
      (req, _res, next) => {
        (req as unknown as { authUser: { userId: string } }).authUser = { userId: "user-1" };
        next();
      },
      responseCache(60, {
        scope: () => {
          throw new Error("scope lookup failed");
        },
      }),
      (_req, res) => {
        callCount++;
        res.json({ call: callCount });
      },
    );

    const first = await request(app).get("/failing-scope");
    const second = await request(app).get("/failing-scope");
    expect(first.headers["x-cache"]).toBe("BYPASS");
    expect(second.headers["x-cache"]).toBe("BYPASS");
    expect(callCount).toBe(2);
  });
});
