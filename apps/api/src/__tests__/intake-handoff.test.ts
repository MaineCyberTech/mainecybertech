import { jest } from "@jest/globals";
import { buildHandoffPlan, FULFILLMENT_CHECKLIST } from "../lib/intake-handoff";

const request = {
  id: "qr-1",
  customer: { name: "Jane Buyer", email: "jane@example.com" },
  items: [
    {
      productId: "password-security-checkup",
      name: "Password Security Checkup",
      priceRange: "$500",
    },
    { productId: "monthly-it-plans-essentials", name: "Monthly IT Plan" },
  ],
  notes: "We need this before the audit",
};

const options = {
  organizationId: "00000000-0000-0000-0000-000000000001",
  createdBy: "00000000-0000-0000-0000-0000000000aa",
  priority: "high",
};

describe("buildHandoffPlan", () => {
  it("derives the project name from the customer when none is given", () => {
    const plan = buildHandoffPlan(request, options);

    expect(plan.project.name).toBe("Jane Buyer — Store intake");
    expect(plan.project.organization_id).toBe(options.organizationId);
    expect(plan.project.created_by).toBe(options.createdBy);
    expect(plan.project.status).toBe("planned");
    expect(plan.project.priority).toBe("high");
    expect(plan.project.metadata).toMatchObject({
      quoteRequestId: "qr-1",
      source: "store_intake",
    });
  });

  it("honours an explicit project name", () => {
    const plan = buildHandoffPlan(request, { ...options, projectName: "Q4 Security Uplift" });
    expect(plan.project.name).toBe("Q4 Security Uplift");
  });

  it("builds the project description from items and notes", () => {
    const plan = buildHandoffPlan(request, options);

    expect(plan.project.description).toContain("store quote request qr-1");
    expect(plan.project.description).toContain("Password Security Checkup ($500)");
    expect(plan.project.description).toContain("Monthly IT Plan");
    expect(plan.project.description).toContain("Customer notes: We need this before the audit");
  });

  it("uses the fulfilment checklist as the task list", () => {
    const plan = buildHandoffPlan(request, options);

    expect(plan.taskTitles).toEqual([...FULFILLMENT_CHECKLIST]);
    expect(plan.taskTitles).toHaveLength(9);
  });

  it("builds a handoff ticket", () => {
    const plan = buildHandoffPlan(request, options);

    expect(plan.ticketTitle).toContain("Jane Buyer — Store intake");
    expect(plan.ticketDescription).toContain("store quote request qr-1");
  });

  it("falls back to an id-derived name for anonymous requests", () => {
    const plan = buildHandoffPlan({ id: "abcdef1234567890", customer: {}, items: [] }, options);

    expect(plan.project.name).toBe("Store intake abcdef12");
    expect(plan.project.description).toContain("(no services selected)");
  });
});
