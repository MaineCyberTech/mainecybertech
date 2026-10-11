import { render } from "@testing-library/react";
import StoreAnalyticsTracker from "@/components/store/StoreAnalyticsTracker";

const mockTrack = jest.fn();

jest.mock("@/lib/catalog/analytics", () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

describe("StoreAnalyticsTracker [AN-P2-003]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fires the view event on mount with the page context", () => {
    render(
      <StoreAnalyticsTracker event="product_detail_view" page="/store/mfa" productId="mfa" />,
    );

    expect(mockTrack).toHaveBeenCalledWith("product_detail_view", {
      page: "/store/mfa",
      productId: "mfa",
      categoryId: undefined,
    });
  });

  it("fires a category view with the category id", () => {
    render(
      <StoreAnalyticsTracker
        event="category_view"
        page="/store/category/cybersecurity"
        categoryId="cybersecurity"
      />,
    );

    expect(mockTrack).toHaveBeenCalledWith("category_view", {
      page: "/store/category/cybersecurity",
      productId: undefined,
      categoryId: "cybersecurity",
    });
  });

  it("renders nothing", () => {
    const { container } = render(<StoreAnalyticsTracker event="store_view" page="/store" />);
    expect(container).toBeEmptyDOMElement();
  });
});
