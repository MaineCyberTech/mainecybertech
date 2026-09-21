import { render, screen } from "@testing-library/react";

const mockListQuoteRequests = jest.fn();
const mockListProposalDrafts = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: {
      listQuoteRequests: mockListQuoteRequests,
      listProposalDrafts: mockListProposalDrafts,
    },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: () => mockRequireAdminAccess(),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const quoteRequest = {
  id: "qr-1",
  status: "submitted",
  customer: { name: "Jane Buyer", email: "jane@example.com" },
  items: [{ productId: "p-1", name: "Password Security Checkup" }],
  selected_promo_ids: [],
  recommended_bundle_ids: [],
  notes: "Need help soon",
  created_at: "2026-09-21T10:00:00.000Z",
  updated_at: "2026-09-21T10:00:00.000Z",
};

describe("AdminStoreQuoteRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListQuoteRequests.mockResolvedValue([]);
    mockListProposalDrafts.mockResolvedValue([]);
  });

  it("renders the page shell and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/store/quote-requests/page")).default;

    render(await Page());

    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: /structured quote requests/i })).toBeInTheDocument();
  });

  it("shows an empty state when there are no requests", async () => {
    const Page = (await import("@/app/(admin)/admin/store/quote-requests/page")).default;

    render(await Page());

    expect(screen.getByText(/no quote requests yet/i)).toBeInTheDocument();
  });

  it("renders quote requests with customer, items and a draft action", async () => {
    mockListQuoteRequests.mockResolvedValue([quoteRequest]);
    const Page = (await import("@/app/(admin)/admin/store/quote-requests/page")).default;

    render(await Page());

    expect(screen.getByText("Jane Buyer")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Password Security Checkup/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate proposal draft/i })).toBeInTheDocument();
  });

  it("renders existing proposal drafts for a request", async () => {
    mockListQuoteRequests.mockResolvedValue([quoteRequest]);
    mockListProposalDrafts.mockResolvedValue([
      {
        id: "pd-12345678",
        quote_request_id: "qr-1",
        status: "draft_internal",
        sections: {},
        generated_by: null,
        reviewed_by: null,
        created_at: "2026-09-21T11:00:00.000Z",
        updated_at: "2026-09-21T11:00:00.000Z",
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/quote-requests/page")).default;

    render(await Page());

    expect(screen.getByText(/proposal drafts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/proposal draft status/i)).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    mockListQuoteRequests.mockRejectedValue(new Error("API down"));
    mockListProposalDrafts.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/quote-requests/page")).default;

    render(await Page());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
