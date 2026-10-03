import { render, screen } from "@testing-library/react";

const mockListQuoteRequests = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ store: { listQuoteRequests: mockListQuoteRequests } }),
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

const pending = {
  id: "qr-1",
  status: "submitted",
  customer: { name: "Jane Buyer", email: "jane@example.com" },
  items: [{ productId: "p-1", name: "Password Security Checkup" }],
  selected_promo_ids: [],
  recommended_bundle_ids: [],
  notes: null,
  created_at: "2026-09-21T10:00:00.000Z",
  updated_at: "2026-09-21T10:00:00.000Z",
};

describe("AdminStoreOperationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListQuoteRequests.mockResolvedValue([]);
  });

  it("renders the page and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;

    render(await Page());

    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { name: /intake-to-project operations/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when nothing awaits handoff", async () => {
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;

    render(await Page());

    expect(screen.getByText(/nothing awaiting handoff/i)).toBeInTheDocument();
  });

  it("renders the convert form for pending quote requests", async () => {
    mockListQuoteRequests.mockResolvedValue([pending]);
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;

    render(await Page());

    expect(screen.getByText("Jane Buyer")).toBeInTheDocument();
    expect(screen.getByLabelText(/organization id/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /convert to project/i })).toBeInTheDocument();
  });

  it("separates converted requests", async () => {
    mockListQuoteRequests.mockResolvedValue([
      pending,
      { ...pending, id: "qr-2", status: "converted_to_project", customer: { name: "Done Co" } },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;

    render(await Page());

    expect(screen.getByText(/converted \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Done Co")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /convert to project/i })).toHaveLength(1);
  });

  it("surfaces a load failure", async () => {
    mockListQuoteRequests.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/operations/page")).default;

    render(await Page());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
