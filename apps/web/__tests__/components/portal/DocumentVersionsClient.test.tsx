import { jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockListVersions = jest.fn();
const mockCreateVersionSignedUrl = jest.fn();
const mockRestoreDocumentVersionAction = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    documents: {
      listVersions: mockListVersions,
      createVersionSignedUrl: mockCreateVersionSignedUrl,
    },
  }),
}));

jest.mock("@/app/(portal)/portal/documents/[documentId]/actions", () => ({
  restoreDocumentVersionAction: mockRestoreDocumentVersionAction,
}));

describe("DocumentVersionsClient (USE-P3-003)", () => {
  let DocumentVersionsClient: typeof import("@/components/portal/DocumentVersionsClient").default;

  beforeAll(async () => {
    DocumentVersionsClient = (await import("@/components/portal/DocumentVersionsClient")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockListVersions.mockResolvedValue({
      items: [
        {
          id: "v-2",
          version_number: 2,
          uploaded_by: "user-1",
          created_at: "2026-02-01T10:00:00.000Z",
        },
        {
          id: "v-1",
          version_number: 1,
          uploaded_by: "user-1",
          created_at: "2026-01-01T10:00:00.000Z",
        },
      ],
    });
    mockCreateVersionSignedUrl.mockResolvedValue({ signedUrl: "https://s3.test/v1", expiresIn: 3600 });
    mockRestoreDocumentVersionAction.mockResolvedValue({ ok: true, version: 3 });
    jest.spyOn(window, "open").mockImplementation(() => null);
  });

  it("shows the section for a single-version document instead of hiding it", async () => {
    mockListVersions.mockResolvedValue({
      items: [
        {
          id: "v-1",
          version_number: 1,
          uploaded_by: "user-1",
          created_at: "2026-01-01T10:00:00.000Z",
        },
      ],
    });

    render(<DocumentVersionsClient documentId="doc-1" currentVersion={1} />);

    expect(await screen.findByText("Version History")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    // The only version cannot be restored over itself, but it can be downloaded.
    expect(screen.queryByRole("button", { name: "Restore" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download" })).toBeInTheDocument();
  });

  it("downloads a past version through the per-version signed URL", async () => {
    const user = userEvent.setup();
    render(<DocumentVersionsClient documentId="doc-1" currentVersion={2} />);

    const downloadButtons = await screen.findAllByRole("button", { name: "Download" });
    await user.click(downloadButtons[1]);

    await waitFor(() => {
      expect(mockCreateVersionSignedUrl).toHaveBeenCalledWith("doc-1", "v-1");
    });
    expect(window.open).toHaveBeenCalledWith(
      "https://s3.test/v1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("restores a past version and confirms the new version number", async () => {
    const user = userEvent.setup();
    render(<DocumentVersionsClient documentId="doc-1" currentVersion={2} />);

    await user.click(await screen.findByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(mockRestoreDocumentVersionAction).toHaveBeenCalledWith("doc-1", "v-1");
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Version 1 was restored as version 3",
    );
  });

  it("surfaces a load failure instead of rendering 'no history'", async () => {
    mockListVersions.mockRejectedValue(new Error("network down"));

    render(<DocumentVersionsClient documentId="doc-1" currentVersion={1} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/could not load version history/i);
    expect(screen.queryByText(/no version history/i)).not.toBeInTheDocument();
  });

  it("surfaces a restore failure with the API's message", async () => {
    mockRestoreDocumentVersionAction.mockResolvedValue({
      ok: false,
      error: "This record was modified by someone else.",
    });
    const user = userEvent.setup();
    render(<DocumentVersionsClient documentId="doc-1" currentVersion={2} />);

    await user.click(await screen.findByRole("button", { name: "Restore" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This record was modified by someone else.",
    );
  });
});
