import { render, screen } from "@testing-library/react";
import BillingPageClient from "@/app/(portal)/portal/billing/BillingPageClient";

const mockCan = jest.fn();
jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({ can: (...args: unknown[]) => mockCan(...args) }),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    billing: {
      syncFromStripe: jest.fn(),
      createPortalSession: jest.fn(),
    },
  }),
}));

const summary = {
  activeSubscriptions: 1,
  overdueInvoices: 0,
  paidInvoices: 1,
  totalInvoices: 2,
};

const subscription = {
  id: "sub-1",
  plan_name: "Pro",
  status: "trialing",
  amount_cents: 9900,
  currency: "usd",
  interval: "month",
  quantity: 3,
  current_period_end: "2026-11-01T00:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
};

function renderBilling(overrides: Partial<Parameters<typeof BillingPageClient>[0]> = {}) {
  return render(
    <BillingPageClient
      summary={summary}
      subscriptions={[subscription]}
      invoices={[]}
      customer={null}
      {...overrides}
    />,
  );
}

describe("BillingPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCan.mockReturnValue(true);
  });

  it("shows the Sync button only when the caller holds billing:manage (BILL-P3-007)", () => {
    mockCan.mockReturnValue(false);
    const { unmount } = renderBilling();
    expect(screen.queryByRole("button", { name: /sync from stripe/i })).not.toBeInTheDocument();
    expect(mockCan).toHaveBeenCalledWith("billing", "manage");
    unmount();

    mockCan.mockReturnValue(true);
    renderBilling();
    expect(screen.getByRole("button", { name: /sync from stripe/i })).toBeInTheDocument();
  });

  it("renders a trialing multi-seat plan as the seat total with its interval (BILL-P3-006)", () => {
    renderBilling();
    const plan = screen.getByText("Pro");
    expect(plan.parentElement?.textContent).toContain("$297.00/mo · 3 seats");
    expect(screen.getByText("trialing")).toBeInTheDocument();
  });

  it("uses the stored yearly interval in the subscription history (BILL-P3-006)", () => {
    renderBilling({
      subscriptions: [
        subscription,
        { ...subscription, id: "sub-2", plan_name: "Legacy", status: "canceled", interval: "year" },
      ],
    });
    const legacy = screen.getByText("Legacy");
    expect(legacy.parentElement?.textContent).toContain("$297.00/yr");
  });
});
