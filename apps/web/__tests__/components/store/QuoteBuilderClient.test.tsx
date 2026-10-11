import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuoteBuilderClient from "@/components/store/QuoteBuilderClient";
import { getAllProducts } from "@/lib/catalog/loader";

const mockSubmitQuote = jest.fn();
const mockTrack = jest.fn();

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    store: { submitQuote: (...args: unknown[]) => mockSubmitQuote(...args) },
  }),
}));

jest.mock("@/lib/catalog/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

const products = getAllProducts();

describe("QuoteBuilderClient [AN-P2-003]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("tracks quote_submit after a successful submission", async () => {
    const product = products.find((entry) => entry.display);
    expect(product).toBeDefined();
    localStorage.setItem(
      "mct_quote",
      JSON.stringify([
        {
          productId: product!.id,
          name: product!.name,
          priceRange: product!.priceRange,
          riskLevel: product!.riskLevel,
          purchaseMode: product!.purchaseMode,
          tags: product!.tags,
        },
      ]),
    );
    mockSubmitQuote.mockResolvedValue({});

    render(<QuoteBuilderClient products={products} />);

    fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: "555-0100" } });

    await waitFor(() => expect(screen.getByText("Submit Quote Request")).toBeEnabled());
    fireEvent.click(screen.getByText("Submit Quote Request"));

    await waitFor(() => expect(mockSubmitQuote).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith("quote_submit", { page: "/store/quote" }),
    );
  });

  it("does not track quote_submit when the API rejects the submission", async () => {
    const product = products.find((entry) => entry.display);
    localStorage.setItem(
      "mct_quote",
      JSON.stringify([
        {
          productId: product!.id,
          name: product!.name,
          priceRange: product!.priceRange,
          riskLevel: product!.riskLevel,
          purchaseMode: product!.purchaseMode,
          tags: product!.tags,
        },
      ]),
    );
    mockSubmitQuote.mockRejectedValue(new Error("boom"));

    render(<QuoteBuilderClient products={products} />);

    fireEvent.change(await screen.findByLabelText(/^Name/), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/^Phone/), { target: { value: "555-0100" } });

    await waitFor(() => expect(screen.getByText("Submit Quote Request")).toBeEnabled());
    fireEvent.click(screen.getByText("Submit Quote Request"));

    await waitFor(() => expect(mockSubmitQuote).toHaveBeenCalledTimes(1));
    expect(mockTrack).not.toHaveBeenCalledWith("quote_submit", { page: "/store/quote" });
  });
});
