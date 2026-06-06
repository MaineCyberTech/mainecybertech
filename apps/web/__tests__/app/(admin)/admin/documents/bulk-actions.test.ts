import { jest } from "@jest/globals";

const mockBulkFolder = jest.fn();
const mockBulkMetadata = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  documents: {
    bulkFolder: mockBulkFolder,
    bulkMetadata: mockBulkMetadata,
  },
});

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

describe("bulkFolderAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("moves documents to a folder", async () => {
    mockBulkFolder.mockResolvedValue(undefined);

    const { bulkFolderAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.append("documentIds", "doc-2");
    formData.set("folderPath", "/Contracts");

    const result = await bulkFolderAction(formData);

    expect(result).toEqual({
      ok: true,
      kind: "bulk_folder",
      ids: ["doc-1", "doc-2"],
      folderPath: "/Contracts",
    });
    expect(mockBulkFolder).toHaveBeenCalledWith({
      documentIds: ["doc-1", "doc-2"],
      folderPath: "/Contracts",
    });
  });

  it("returns error when no document ids", async () => {
    const { bulkFolderAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();

    const result = await bulkFolderAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Select at least one document.",
    });
    expect(mockBulkFolder).not.toHaveBeenCalled();
  });

  it("returns error when no folder path", async () => {
    const { bulkFolderAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");

    const result = await bulkFolderAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Provide a folder path to apply.",
    });
    expect(mockBulkFolder).not.toHaveBeenCalled();
  });

  it("returns error when API call fails", async () => {
    mockBulkFolder.mockRejectedValue(new Error("API failure"));

    const { bulkFolderAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("folderPath", "/Test");

    const result = await bulkFolderAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "API failure",
    });
  });

  it("handles non-Error API failure", async () => {
    mockBulkFolder.mockRejectedValue("string error");

    const { bulkFolderAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("folderPath", "/Test");

    const result = await bulkFolderAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Unexpected error.",
    });
  });
});

describe("bulkMetadataAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies description metadata", async () => {
    mockBulkMetadata.mockResolvedValue(undefined);

    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("description", "Updated description");

    const result = await bulkMetadataAction(formData);

    expect(result).toEqual({
      ok: true,
      kind: "bulk_metadata",
      ids: ["doc-1"],
      applied: {
        description: "Updated description",
        folderPath: null,
        visibility: null,
      },
    });
    expect(mockBulkMetadata).toHaveBeenCalledWith({
      documentIds: ["doc-1"],
      description: "Updated description",
      folderPath: null,
      visibility: null,
    });
  });

  it("applies folder path and visibility", async () => {
    mockBulkMetadata.mockResolvedValue(undefined);

    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("folderPath", "/Archive");
    formData.set("visibility", "internal");

    const result = await bulkMetadataAction(formData);

    expect(result).toEqual({
      ok: true,
      kind: "bulk_metadata",
      ids: ["doc-1"],
      applied: {
        description: null,
        folderPath: "/Archive",
        visibility: "internal",
      },
    });
    expect(mockBulkMetadata).toHaveBeenCalledWith({
      documentIds: ["doc-1"],
      description: null,
      folderPath: "/Archive",
      visibility: "internal",
    });
  });

  it("rejects invalid visibility value", async () => {
    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("description", "Test");
    formData.set("visibility", "invalid_value");

    const result = await bulkMetadataAction(formData);

    expect(result.ok).toBe(true);
    expect(mockBulkMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: null }),
    );
  });

  it("returns error when no document ids", async () => {
    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();

    const result = await bulkMetadataAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Select at least one document.",
    });
    expect(mockBulkMetadata).not.toHaveBeenCalled();
  });

  it("returns error when no metadata fields are provided", async () => {
    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");

    const result = await bulkMetadataAction(formData);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("No non-empty bulk metadata fields");
    expect(mockBulkMetadata).not.toHaveBeenCalled();
  });

  it("handles API failure gracefully", async () => {
    mockBulkMetadata.mockRejectedValue(new Error("Timeout"));

    const { bulkMetadataAction } = await import(
      "@/app/(admin)/admin/documents/bulk-actions"
    );

    const formData = new FormData();
    formData.append("documentIds", "doc-1");
    formData.set("description", "Test");

    const result = await bulkMetadataAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Timeout",
    });
  });
});
