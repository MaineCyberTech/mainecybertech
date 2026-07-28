import { render, screen } from "@testing-library/react";

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/NotificationsPageClient", () => {
  return function MockNotificationsPageClient({ basePath }: any) {
    return <div data-testid="notifications-client">{basePath}</div>;
  };
});

describe("AdminNotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/notifications/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText(/View your notification history/)).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/notifications/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("renders NotificationsPageClient with basePath", async () => {
    const Page = (await import("@/app/(admin)/admin/notifications/page")).default;
    render(await Page());
    expect(screen.getByTestId("notifications-client")).toHaveTextContent("/admin");
  });
});
