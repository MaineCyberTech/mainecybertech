import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server.node";
import DocumentShareClient from "@/components/portal/DocumentShareClient";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { DocumentShare } from "@mct/sdk";

function makeShare(overrides: Partial<DocumentShare> = {}): DocumentShare {
  return {
    id: "share-1",
    document_id: "doc-1",
    organization_id: "org-1",
    created_by: "user-1",
    token: "tok-1",
    expires_at: "2099-01-01T00:00:00.000Z",
    access_count: 2,
    max_access: 10,
    revoked_at: null,
    created_at: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function renderClient(shares: DocumentShare[] = [makeShare()]) {
  return render(
    <ToastProvider>
      <DocumentShareClient documentId="doc-1" initialShares={shares} />
    </ToastProvider>,
  );
}

describe("DocumentShareClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("renders share links during server rendering without touching window", () => {
    const globalWithWindow = globalThis as { window?: Window };
    const savedWindow = globalWithWindow.window;
    globalWithWindow.window = undefined;
    try {
      const html = renderToString(
        <ToastProvider>
          <DocumentShareClient documentId="doc-1" initialShares={[makeShare()]} />
        </ToastProvider>,
      );

      expect(html).toContain("/api/v1/documents/shares/tok-1");
      expect(html).not.toContain("http://localhost/api");
    } finally {
      globalWithWindow.window = savedWindow;
    }
  });

  it("shows the full share link after mount", async () => {
    renderClient();

    expect(
      await screen.findByText(`${window.location.origin}/api/v1/documents/shares/tok-1`),
    ).toBeInTheDocument();
  });

  it("copies the share link via navigator.clipboard and toasts", async () => {
    renderClient();
    const writeText = navigator.clipboard.writeText as jest.Mock;

    fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/api/v1/documents/shares/tok-1`,
      ),
    );
    expect(await screen.findByText("Share link copied to your clipboard.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });
});
