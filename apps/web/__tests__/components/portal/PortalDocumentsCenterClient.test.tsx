import { render, screen, fireEvent } from "@testing-library/react";
import PortalDocumentsCenterClient from "@/components/portal/PortalDocumentsCenterClient";
import { ToastProvider } from "@/components/ui/ToastProvider";

const mockUploadAction = jest.fn();

function renderClient() {
  return render(
    <ToastProvider>
      <PortalDocumentsCenterClient
        documents={[]}
        organizationId="org-1"
        uploadAction={mockUploadAction}
      />
    </ToastProvider>,
  );
}

describe("PortalDocumentsCenterClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the upload form", () => {
    renderClient();
    expect(screen.getByRole("heading", { name: "Upload Document" })).toBeInTheDocument();
  });

  it("shows a shared success toast after a successful upload", async () => {
    mockUploadAction.mockResolvedValue({ ok: true, document: { id: "d1" } });
    renderClient();
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [file] } });
    fireEvent.submit(screen.getByRole("button", { name: "Upload Document" }).closest("form")!);
    expect(await screen.findByText("Document uploaded successfully")).toBeInTheDocument();
  });

  it("shows a shared error toast when the upload fails", async () => {
    mockUploadAction.mockResolvedValue({ ok: false, error: "Storage rejected the file" });
    renderClient();
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [file] } });
    fireEvent.submit(screen.getByRole("button", { name: "Upload Document" }).closest("form")!);
    expect(await screen.findByText("Storage rejected the file")).toBeInTheDocument();
  });
});
