import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/components/NotificationsPageClient", () => ({
  __esModule: true,
  default: ({ basePath }: { basePath: string }) => (
    <div data-testid="notifications-client" data-basepath={basePath}>
      Notifications Client
    </div>
  ),
}));

describe("PortalNotificationsPage", () => {
  it("renders notifications heading", async () => {
    const { default: PortalNotificationsPage } =
      await import("@/app/(portal)/portal/notifications/page");
    const element = PortalNotificationsPage();
    render(element);

    expect(screen.getByRole("heading", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText(/view your notification history/i)).toBeInTheDocument();
  });

  it("renders NotificationsPageClient with correct basePath", async () => {
    const { default: PortalNotificationsPage } =
      await import("@/app/(portal)/portal/notifications/page");
    const element = PortalNotificationsPage();
    render(element);

    const client = screen.getByTestId("notifications-client");
    expect(client).toHaveAttribute("data-basepath", "/portal");
  });

  it("renders breadcrumbs with portal link", async () => {
    const { default: PortalNotificationsPage } =
      await import("@/app/(portal)/portal/notifications/page");
    const element = PortalNotificationsPage();
    render(element);

    const portalLink = screen.getByText("Portal").closest("a");
    expect(portalLink).toHaveAttribute("href", "/portal/dashboard");
  });
});
