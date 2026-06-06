import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsList = jest.fn();
const mockDocsList = jest.fn();
const mockDocsCreate = jest.fn();
const mockDocsUpdate = jest.fn();
const mockDocsUpload = jest.fn();
const mockDocsRemove = jest.fn();
const mockDocsBulkMetadata = jest.fn();
const mockDocsGet = jest.fn();
const mockDocsCreateSignedUrl = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
    documents: {
      list: mockDocsList,
      create: mockDocsCreate,
      update: mockDocsUpdate,
      upload: mockDocsUpload,
      remove: mockDocsRemove,
      bulkMetadata: mockDocsBulkMetadata,
      get: mockDocsGet,
      createSignedUrl: mockDocsCreateSignedUrl,
    },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

const MockDocCenterClient = jest.fn();
jest.mock("@/components/admin/AdminDocumentsCenterClient", () => {
  return function MockAdminDocumentsCenterClient(props: any) {
    MockDocCenterClient(props);
    return <div data-testid="documents-center-client" />;
  };
});

jest.mock("@/app/(admin)/admin/documents/bulk-actions", () => ({
  bulkFolderAction: jest.fn(),
  bulkMetadataAction: jest.fn(),
}));

const baseDoc = {
  id: "d1",
  organization_id: "o1",
  name: "Report.pdf",
  title: "Annual Report",
  description: "Q1 report",
  folder_path: "/finance",
  storage_bucket: "documents",
  storage_path: "reports/report.pdf",
  mime_type: "application/pdf",
  visibility: "org",
  file_name: "report.pdf",
  file_size: 1024,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("AdminDocumentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    mockDocsList.mockResolvedValue({ items: [baseDoc], total: 1 });
    mockDocsCreateSignedUrl.mockResolvedValue({ signedUrl: "https://example.com/doc" });
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("documents");
  });

  it("renders AdminDocumentsCenterClient", async () => {
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    expect(screen.getByTestId("documents-center-client")).toBeInTheDocument();
  });

  it("passes documents to the client component", async () => {
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents).toHaveLength(1);
    expect(props.documents[0].display_name).toBe("Annual Report");
    expect(props.documents[0].preview_kind).toBe("pdf");
    expect(props.documents[0].organization_name).toBe("Acme Corp");
  });

  it("passes organizations to the client component", async () => {
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.organizations).toHaveLength(1);
    expect(props.organizations[0].name).toBe("Acme Corp");
  });

  it("passes all server action functions as props", async () => {
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(typeof props.createDocumentAction).toBe("function");
    expect(typeof props.updateMetadataAction).toBe("function");
    expect(typeof props.updateVisibilityAction).toBe("function");
    expect(typeof props.replaceFileAction).toBe("function");
    expect(typeof props.deleteDocumentAction).toBe("function");
    expect(typeof props.bulkVisibilityAction).toBe("function");
    expect(typeof props.bulkDeleteAction).toBe("function");
    expect(typeof props.bulkFolderAction).toBe("function");
    expect(typeof props.bulkMetadataAction).toBe("function");
  });

  it("resolves signed URL for documents", async () => {
    mockDocsCreateSignedUrl.mockResolvedValue({ signedUrl: "https://cdn.example.com/doc.pdf" });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].resolved_url).toBe("https://cdn.example.com/doc.pdf");
  });

  it("returns null signed URL on error", async () => {
    mockDocsCreateSignedUrl.mockRejectedValue(new Error("network error"));
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].resolved_url).toBeNull();
  });

  it("sets organization_name to null when org not found", async () => {
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].organization_name).toBeNull();
  });

  it("handles empty documents list", async () => {
    mockDocsList.mockResolvedValue({ items: [], total: 0 });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents).toHaveLength(0);
  });

  it("uses title or name as display_name fallback chain", async () => {
    mockDocsList.mockResolvedValue({
      items: [
        { ...baseDoc, title: null, name: null, file_name: "doc.txt", storage_path: "path/doc.txt" },
      ],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].display_name).toBe("doc.txt");
  });

  it("infers preview_kind from mime_type", async () => {
    mockDocsList.mockResolvedValue({
      items: [
        { ...baseDoc, mime_type: "image/png", file_name: "photo.png" },
        { ...baseDoc, id: "d2", mime_type: "text/plain", file_name: "notes.txt" },
        { ...baseDoc, id: "d3", mime_type: "video/mp4", file_name: "clip.mp4" },
        { ...baseDoc, id: "d4", mime_type: "audio/mpeg", file_name: "song.mp3" },
        { ...baseDoc, id: "d5", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_name: "doc.docx" },
      ],
      total: 5,
    });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].preview_kind).toBe("image");
    expect(props.documents[1].preview_kind).toBe("text");
    expect(props.documents[2].preview_kind).toBe("video");
    expect(props.documents[3].preview_kind).toBe("audio");
    expect(props.documents[4].preview_kind).toBe("office");
  });

  it("returns signed URL null for empty storage_path", async () => {
    mockDocsList.mockResolvedValue({
      items: [{ ...baseDoc, storage_path: "" }],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].resolved_url).toBeNull();
  });

  it("treats absolute URLs as resolved without signed URL call", async () => {
    mockDocsList.mockResolvedValue({
      items: [{ ...baseDoc, storage_path: "https://external.com/file.pdf" }],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/documents/page")).default;
    render(await Page());
    const props = MockDocCenterClient.mock.calls[MockDocCenterClient.mock.calls.length - 1][0];
    expect(props.documents[0].resolved_url).toBe("https://external.com/file.pdf");
    expect(mockDocsCreateSignedUrl).not.toHaveBeenCalled();
  });
});
