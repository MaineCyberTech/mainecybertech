import { z } from "zod";
import { parsePartialUpdate } from "../lib/validators";

describe("parsePartialUpdate", () => {
  const schema = z.object({
    name: z.string(),
    organizationId: z.string(),
    status: z.string().optional(),
  });

  it("parses the provided fields", () => {
    expect(parsePartialUpdate(schema, { name: "x" })).toEqual({ name: "x" });
  });

  it("strips unknown keys (mass-assignment guard)", () => {
    const out = parsePartialUpdate(schema, {
      name: "x",
      created_by: "attacker",
      id: "forged",
      organization_id: "other-org",
    });
    expect(out).toEqual({ name: "x" });
    expect(out).not.toHaveProperty("created_by");
    expect(out).not.toHaveProperty("id");
    expect(out).not.toHaveProperty("organization_id");
  });

  it("rejects invalid field types", () => {
    expect(() => parsePartialUpdate(schema, { name: 123 })).toThrow();
  });

  it("throws when the schema has no object shape", () => {
    expect(() => parsePartialUpdate(z.string(), {})).toThrow();
  });
});
