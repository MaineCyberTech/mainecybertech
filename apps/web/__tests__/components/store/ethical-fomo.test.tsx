import { render, screen } from "@testing-library/react";
import QuickWinLadder from "@/components/store/QuickWinLadder";
import TrustPanel, { TrustPanelFromProduct } from "@/components/store/TrustPanel";
import MiniPackageComparison from "@/components/store/MiniPackageComparison";
import { pickCopyVariant, getCopyVariantIds } from "@/lib/catalog/copy-variants";
import type { CatalogProduct } from "@/lib/catalog/types";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "p-1",
    slug: "p-1",
    name: "Product One",
    categoryId: "cat-1",
    category: "Category One",
    type: "service",
    display: true,
    status: "active",
    priceRange: "$100",
    pricingModel: "one_time_or_project",
    purchaseMode: "consultation_or_checkout",
    summary: "Summary one",
    marketingHeadline: "",
    marketingCopy: "",
    bestFor: ["Small business"],
    whatIsIncluded: ["Setup"],
    customerOutcomes: [],
    whatIsNotIncluded: ["Hardware"],
    customerPrerequisites: [],
    intakeFields: [],
    fulfillmentWorkflow: [],
    internalProcedure: {
      triage: [],
      delivery: [],
      documentation: [],
      qa: [],
      closeout: [],
    },
    qaChecklist: [],
    evidenceToCollect: [],
    complianceNotes: [],
    recommendedUpsells: [],
    addOns: [],
    bundleEligible: false,
    tags: [],
    riskLevel: "normal",
    deliveryEffort: "standard",
    ...overrides,
  };
}

describe("copy variants", () => {
  it("exposes configured groups", () => {
    expect(getCopyVariantIds()).toContain("quick_win_ladder_intro");
  });

  it("is deterministic for a seed", () => {
    const a = pickCopyVariant("quick_win_ladder_intro", "seed-a", "fallback");
    const b = pickCopyVariant("quick_win_ladder_intro", "seed-a", "fallback");
    expect(a).toBe(b);
    expect(a).not.toBe("fallback");
  });

  it("falls back for unknown groups", () => {
    expect(pickCopyVariant("nope", "seed", "fallback")).toBe("fallback");
  });
});

describe("QuickWinLadder (prompt 17)", () => {
  it("renders the required primary CTA by accessible role and name", () => {
    render(
      <QuickWinLadder
        quickWin={product({ id: "q", slug: "q", name: "Quick Win" })}
        bundle={product({ id: "b", slug: "b", name: "Bundle" })}
        monthlyPlan={product({ id: "m", slug: "m", name: "Monthly" })}
      />,
    );

    expect(screen.getByRole("link", { name: /start with a quick win/i })).toHaveAttribute(
      "href",
      "/store/quiz",
    );
  });

  it("renders the three ladder steps and their products", () => {
    render(
      <QuickWinLadder
        quickWin={product({ id: "q", slug: "q", name: "Quick Win" })}
        monthlyPlan={product({ id: "m", slug: "m", name: "Monthly" })}
      />,
    );

    expect(screen.getByText(/1 · Quick win/)).toBeInTheDocument();
    expect(screen.getByText(/2 · Bundle/)).toBeInTheDocument();
    expect(screen.getByText(/3 · Monthly plan/)).toBeInTheDocument();
    expect(screen.getAllByText("Quick Win").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Monthly").length).toBeGreaterThan(0);
  });

  it("renders nothing without products", () => {
    const { container } = render(<QuickWinLadder />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("TrustPanel (prompt 17)", () => {
  it("states scope, access, support and exclusions", () => {
    render(<TrustPanel />);

    expect(screen.getByText("What is included")).toBeInTheDocument();
    expect(screen.getByText("No-secret intake")).toBeInTheDocument();
    expect(screen.getByText("Safe-access process")).toBeInTheDocument();
    expect(screen.getByText("Local Maine support")).toBeInTheDocument();
    expect(screen.getByText("Clear exclusions")).toBeInTheDocument();
  });

  it("surfaces product-specific inclusions and exclusions", () => {
    render(<TrustPanelFromProduct product={product()} />);

    expect(screen.getByText(/Setup/)).toBeInTheDocument();
    expect(screen.getByText(/Hardware/)).toBeInTheDocument();
  });

  it("never asks for secrets", () => {
    render(<TrustPanel />);
    expect(
      screen.getByText(/Never send passwords, recovery codes, MFA seeds/i),
    ).toBeInTheDocument();
  });
});

describe("MiniPackageComparison (prompt 17)", () => {
  it("renders good/better/best tiers", () => {
    render(
      <MiniPackageComparison
        tiers={[
          { label: "Good", product: product({ id: "g", slug: "g", name: "Basic" }) },
          { label: "Better", product: product({ id: "b", slug: "b", name: "Plus" }) },
          { label: "Best", product: product({ id: "x", slug: "x", name: "Complete" }) },
        ]}
      />,
    );

    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Better")).toBeInTheDocument();
    expect(screen.getByText("Best")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Good: Basic/ })).toHaveAttribute("href", "/store/g");
  });

  it("renders nothing with fewer than two tiers", () => {
    const { container } = render(
      <MiniPackageComparison tiers={[{ label: "Good", product: product() }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
