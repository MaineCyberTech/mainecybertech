import fs from "fs";
import path from "path";
import { WEBHOOK_EVENTS, isWebhookEvent } from "@mct/sdk/webhook-events";

/**
 * EVOL-P2-002: the outbound webhook event catalog is the single source of
 * truth. These guards fail CI when:
 *  - a `dispatchWebhook("...")` literal is not in the catalog (emitter drift),
 *  - a catalogued event has no emitter (advertised but never fired),
 *  - the API webhook write schemas stop validating against the catalog.
 */

const SRC_DIRS = [
  path.join(__dirname, "..", "routes"),
  path.join(__dirname, "..", "lib"),
];

function listTsFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : listTsFiles(full);
    }
    return entry.isFile() && entry.name.endsWith(".ts") ? [full] : [];
  });
}

function emittedEvents(): string[] {
  const found = new Set<string>();
  const pattern = /dispatchWebhook\(\s*"([^"]+)"/g;
  for (const file of SRC_DIRS.flatMap(listTsFiles)) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) {
      found.add(match[1]);
    }
  }
  return [...found].sort();
}

describe("webhook event catalog (EVOL-P2-002)", () => {
  it("catalogues every event dispatched by an emitter", () => {
    const uncatalogued = emittedEvents().filter((event) => !isWebhookEvent(event));
    expect(uncatalogued).toEqual([]);
  });

  it("has at least one emitter for every catalogued event", () => {
    const emitted = new Set(emittedEvents());
    const orphaned = WEBHOOK_EVENTS.filter((event) => !emitted.has(event));
    expect(orphaned).toEqual([]);
  });

  it("rejects unknown event names", () => {
    expect(isWebhookEvent("ticket.created")).toBe(true);
    expect(isWebhookEvent("ticket.exploded")).toBe(false);
  });

  it("keeps the API webhook write schemas bound to the catalog", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "..", "routes", "webhook-management.ts"),
      "utf8",
    );
    expect(source).toContain('import { WEBHOOK_EVENTS } from "@mct/sdk/webhook-events"');
    expect(source).toContain("z.array(z.enum(WEBHOOK_EVENTS))");
    // No free-form string event arrays may return.
    expect(source).not.toContain("z.array(z.string().min(1))");
  });

  it("documents every catalogued event in docs/WEBHOOKS.md (WH-P3-002)", () => {
    // The committed consumer catalog must not drift from the SDK catalog: the
    // doc is the integration contract and this guard keeps it complete.
    const doc = fs.readFileSync(
      path.join(__dirname, "..", "..", "..", "..", "docs", "WEBHOOKS.md"),
      "utf8",
    );
    const undocumented = WEBHOOK_EVENTS.filter((event) => !doc.includes(event));
    expect(undocumented).toEqual([]);
  });
});
