import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockDocumentsList = jest.fn();
const mockGetApprovedMembership = jest
  .fn()
  .mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    documents: { list: mockDocumentsList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/portal/PortalBreadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

jest.mock("@/components/portal/PortalDocumentsCenterClient", () => ({
  __esModule: true,
  default: ({ documents, organizationId }: any) =>
    React.createElement("div", { "data-testid": "portal-documents-client" },
      `org:${organizationId},docs:${documents.length}`),
}));

jest.mock("@/app/(portal)/portal/documents/actions", () => ({
  uploadPortalDocument: jest.fn(),
}));

jest.mock("@/app/(portal)/portal/documents/bulk-actions", () => ({
  bulkFolderAction: jest.fn(),
  bulkMetadataAction: jest.fn(),
}));

describe("PortalDocumentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading and breadcrumbs", async () => {
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDocumentsPage } = await import(
      "@/app/(portal)/portal/documents/page"
    );
    const element = await PortalDocumentsPage();
    render(element);

    expect(
      screen.getByRole("heading", { name: /documents/i }),
    ).toBeInTheDocument();
  });

  it("renders portal documents client with data", async () => {
    mockDocumentsList.mockResolvedValue({ items: [{ id: "d1" }, { id: "d2" }] });

    const { default: PortalDocumentsPage } = await import(
      "@/app/(portal)/portal/documents/page"
    );
    const element = await PortalDocumentsPage();
    render(element);

    expect(screen.getByTestId("portal-documents-client")).toHaveTextContent("org:org-1,docs:2");
  });

  it("shows access restricted when no membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalDocumentsPage } = await import(
      "@/app/(portal)/portal/documents/page"
    );
    const element = await PortalDocumentsPage();
    render(element);

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("handles empty documents gracefully", async () => {
    mockDocumentsList.mockResolvedValue({ items: [] });

    const { default: PortalDocumentsPage } = await import(
      "@/app/(portal)/portal/documents/page"
    );
    const element = await PortalDocumentsPage();
    render(element);

    expect(screen.getByTestId("portal-documents-client")).toHaveTextContent("docs:0");
  });
});
