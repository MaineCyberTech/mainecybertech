import { toProductView, toCategoryView } from "@/lib/catalog/store-view";

describe("toProductView", () => {
  it("maps a fully-populated product with rich attributes", () => {
    const product = {
      id: "prod-1",
      slug: "secure-email",
      name: "Secure Email",
      categoryId: "cat-1",
      category: "Email",
      type: "service",
      display: true,
      status: "published",
      priceRange: "$100-200",
      pricingModel: "recurring_monthly",
      purchaseMode: "direct_checkout",
      summary: "Summary",
      marketingHeadline: "Headline",
      marketingCopy: "Copy",
      tags: ["a", "b"],
      attributes: {
        bestFor: ["smb"],
        whatIsIncluded: ["x"],
        customerOutcomes: ["y"],
        whatIsNotIncluded: ["z"],
        customerPrerequisites: ["p"],
        intakeFields: [{ id: "f1", label: "Email", type: "email", required: true, help: "h" }],
        fulfillmentWorkflow: ["step1"],
        internalProcedure: {
          triage: ["t1"],
          delivery: ["d1"],
          documentation: ["doc1"],
          qa: ["qa1"],
          closeout: ["c1"],
        },
        qaChecklist: ["q1"],
        evidenceToCollect: ["e1"],
        complianceNotes: ["n1"],
        recommendedUpsells: ["u1"],
        addOns: ["a1"],
        bundleEligible: true,
        riskLevel: "high",
        deliveryEffort: "complex",
      },
    } as any;

    const view = toProductView(product);

    expect(view.id).toBe("prod-1");
    expect(view.bestFor).toEqual(["smb"]);
    expect(view.intakeFields).toEqual([
      { id: "f1", label: "Email", type: "email", required: true, help: "h" },
    ]);
    expect(view.internalProcedure).toEqual({
      triage: ["t1"],
      delivery: ["d1"],
      documentation: ["doc1"],
      qa: ["qa1"],
      closeout: ["c1"],
    });
    expect(view.bundleEligible).toBe(true);
    expect(view.riskLevel).toBe("high");
    expect(view.deliveryEffort).toBe("complex");
    expect(view.tags).toEqual(["a", "b"]);
  });

  it("applies defaults when attributes are missing", () => {
    const product = {
      id: "prod-2",
      slug: "basic",
      name: "Basic",
      tags: null,
    } as any;

    const view = toProductView(product);

    expect(view.categoryId).toBe("");
    expect(view.type).toBe("service");
    expect(view.display).toBe(true);
    expect(view.status).toBe("draft");
    expect(view.pricingModel).toBe("one_time_or_project");
    expect(view.purchaseMode).toBe("consultation_or_checkout");
    expect(view.bestFor).toEqual([]);
    expect(view.intakeFields).toEqual([]);
    expect(view.internalProcedure).toEqual({
      triage: [],
      delivery: [],
      documentation: [],
      qa: [],
      closeout: [],
    });
    expect(view.bundleEligible).toBe(false);
    expect(view.riskLevel).toBe("normal");
    expect(view.deliveryEffort).toBe("standard");
    expect(view.tags).toEqual([]);
  });

  it("returns empty arrays when attributes are not arrays", () => {
    const product = {
      id: "prod-3",
      attributes: {
        bestFor: "not-an-array",
        intakeFields: "nope",
        internalProcedure: "broken",
      },
    } as any;

    const view = toProductView(product);

    expect(view.bestFor).toEqual([]);
    expect(view.intakeFields).toEqual([]);
    expect(view.internalProcedure).toEqual({
      triage: [],
      delivery: [],
      documentation: [],
      qa: [],
      closeout: [],
    });
  });

  it("partially populates internal procedure", () => {
    const product = {
      id: "prod-4",
      attributes: { internalProcedure: { triage: ["only"] } },
    } as any;

    const view = toProductView(product);

    expect(view.internalProcedure).toEqual({
      triage: ["only"],
      delivery: [],
      documentation: [],
      qa: [],
      closeout: [],
    });
  });
});

describe("toCategoryView", () => {
  it("maps a fully-populated category", () => {
    const category = {
      id: "cat-1",
      name: "Email",
      slug: "email",
      description: "Email security",
      productIds: ["p1", "p2"],
      count: 5,
    } as any;

    expect(toCategoryView(category)).toEqual({
      id: "cat-1",
      name: "Email",
      slug: "email",
      description: "Email security",
      productIds: ["p1", "p2"],
      count: 5,
    });
  });

  it("falls back to productCount then 0", () => {
    const category = {
      id: "cat-2",
      name: "Backup",
      slug: "backup",
      productIds: [],
    } as any;
    expect(toCategoryView(category).count).toBe(0);

    const withProductCount = {
      id: "cat-3",
      name: "DR",
      slug: "dr",
      productCount: 9,
    } as any;
    expect(toCategoryView(withProductCount).count).toBe(9);
  });

  it("applies defaults for missing fields", () => {
    const category = { id: "cat-4", name: "X", slug: "x" } as any;
    const view = toCategoryView(category);
    expect(view.description).toBe("");
    expect(view.productIds).toEqual([]);
    expect(view.count).toBe(0);
  });
});
