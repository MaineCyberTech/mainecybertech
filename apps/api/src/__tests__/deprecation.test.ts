import express from "express";
import request from "supertest";
import {
  DEPRECATIONS,
  deprecationHeaders,
  deprecationMiddleware,
  deprecationNotice,
} from "../middleware/deprecation";
import { goneRoute } from "../lib/deprecated-route";

/**
 * EVOL-P3-004: the documented deprecation policy (Sunset header, successor
 * link) is now enforced by middleware/deprecation.ts. These tests pin the
 * header contract so a future edit cannot silently drop the headers.
 */
describe("deprecation headers (EVOL-P3-004)", () => {
  it("builds RFC 9745 Deprecation, RFC 8594 Sunset and RFC 8288 links", () => {
    const policy = DEPRECATIONS["final/satisfaction"];
    const headers = deprecationHeaders(policy);
    expect(headers.Deprecation).toBe("true");
    expect(headers.Sunset).toBe(policy.sunset);
    expect(headers.Sunset).toMatch(/GMT$/);
    expect(headers.Link).toContain(`<${policy.successor}>; rel="successor-version"`);
    expect(headers.Link).toContain('rel="deprecation"');
  });

  it("registers every hard-deprecated alias with a successor and sunset", () => {
    const entries = Object.values(DEPRECATIONS);
    expect(entries.length).toBeGreaterThanOrEqual(3);
    for (const policy of entries) {
      expect(policy.path.startsWith("/api/v1/")).toBe(true);
      expect(policy.successor.startsWith("/api/v1/")).toBe(true);
      expect(policy.sunset).toMatch(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
    }
  });

  describe("app-wide middleware", () => {
    const app = express();
    app.use(deprecationMiddleware());
    app.get("/api/v1/final/satisfaction", (_req, res) => res.json({ ok: true }));
    app.get("/api/v1/final/satisfaction/sub", (_req, res) => res.json({ ok: true }));
    app.get("/api/v1/tickets", (_req, res) => res.json({ ok: true }));

    it("stamps headers on the deprecated path and its subpaths", async () => {
      for (const path of ["/api/v1/final/satisfaction", "/api/v1/final/satisfaction/sub"]) {
        const res = await request(app).get(path);
        expect(res.status).toBe(200);
        expect(res.headers.deprecation).toBe("true");
        expect(res.headers.sunset).toBe(DEPRECATIONS["final/satisfaction"].sunset);
        expect(res.headers.link).toContain('rel="successor-version"');
      }
    });

    it("leaves non-deprecated paths untouched", async () => {
      const res = await request(app).get("/api/v1/tickets");
      expect(res.status).toBe(200);
      expect(res.headers.deprecation).toBeUndefined();
      expect(res.headers.sunset).toBeUndefined();
    });
  });

  it("goneRoute fails closed with 410 + Sunset + successor link", async () => {
    const app = express();
    app.use("/api/v1/final", goneRoute("final/satisfaction"));
    const res = await request(app).get("/api/v1/final/satisfaction");
    expect(res.status).toBe(410);
    expect(res.headers.deprecation).toBe("true");
    expect(res.headers.sunset).toBe(DEPRECATIONS["final/satisfaction"].sunset);
    expect(res.headers.link).toContain('rel="successor-version"');
    expect(res.body.error.message).toContain("/api/v1/satisfaction-pulse");
  });

  it("deprecationNotice attaches the same headers to a live route", async () => {
    const app = express();
    app.get("/api/v1/legacy", deprecationNotice("final/satisfaction"), (_req, res) =>
      res.json({ ok: true }),
    );
    const res = await request(app).get("/api/v1/legacy");
    expect(res.status).toBe(200);
    expect(res.headers.deprecation).toBe("true");
    expect(res.headers.sunset).toBe(DEPRECATIONS["final/satisfaction"].sunset);
  });
});
