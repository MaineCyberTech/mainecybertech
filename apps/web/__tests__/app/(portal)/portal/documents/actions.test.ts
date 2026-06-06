import { jest } from "@jest/globals";

if (!File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function () {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

const mockDocumentsUpload = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  documents: { upload: mockDocumentsUpload },
});
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: (...args: any[]) => mockGetApiClient(...args),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: (...args: any[]) => mockGetApprovedMembership(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("uploadPortalDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads a document with all fields", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { uploadPortalDocument } = await import(
      "@/app/(portal)/portal/documents/actions"
    );

    const formData = new FormData();
    formData.set("name", "Q4 Report");
    formData.set("description", "Quarterly review");
    formData.set("file", new File(["content"], "report.pdf", { type: "application/pdf" }));

    const result = await uploadPortalDocument(formData);

    expect(result.ok).toBe(true);
    expect(mockDocumentsUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        name: "Q4 Report",
        description: "Quarterly review",
        visibility: "org",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/documents");
  });

  it("uses null description when not provided", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { uploadPortalDocument } = await import(
      "@/app/(portal)/portal/documents/actions"
    );

    const formData = new FormData();
    formData.set("name", "Doc");
    formData.set("file", new File(["a"], "doc.txt"));

    const result = await uploadPortalDocument(formData);

    expect(result.ok).toBe(true);
    expect(mockDocumentsUpload).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  it("returns error when title is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { uploadPortalDocument } = await import(
      "@/app/(portal)/portal/documents/actions"
    );

    const formData = new FormData();
    formData.set("file", new File(["a"], "test.txt"));

    const result = await uploadPortalDocument(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Title");
  });

  it("returns error when file is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { uploadPortalDocument } = await import(
      "@/app/(portal)/portal/documents/actions"
    );

    const formData = new FormData();
    formData.set("name", "Test");

    const result = await uploadPortalDocument(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("file");
  });

  it("returns error when no membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { uploadPortalDocument } = await import(
      "@/app/(portal)/portal/documents/actions"
    );

    const formData = new FormData();
    formData.set("name", "Test");
    formData.set("file", new File(["a"], "test.txt"));

    const result = await uploadPortalDocument(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("membership");
  });
});
