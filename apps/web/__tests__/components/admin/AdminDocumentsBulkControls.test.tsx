import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("AdminDocumentsBulkControls", () => {
  let AdminDocumentsBulkControls: typeof import("@/components/admin/AdminDocumentsBulkControls").default;

  const mockBulkFolderAction = jest.fn();
  const mockBulkMetadataAction = jest.fn();
  const mockOnApplyFolderLocal = jest.fn();
  const mockOnApplyMetadataLocal = jest.fn();
  const mockOnClearSelection = jest.fn();
  const mockOnToast = jest.fn();

  const defaultProps = {
    selectedIds: ["doc-1", "doc-2"],
    bulkFolderAction: mockBulkFolderAction,
    bulkMetadataAction: mockBulkMetadataAction,
    onApplyFolderLocal: mockOnApplyFolderLocal,
    onApplyMetadataLocal: mockOnApplyMetadataLocal,
    onClearSelection: mockOnClearSelection,
    onToast: mockOnToast,
  };

  beforeAll(async () => {
    AdminDocumentsBulkControls = (await import("@/components/admin/AdminDocumentsBulkControls")).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when no items selected", () => {
    const { container } = render(
      <AdminDocumentsBulkControls {...defaultProps} selectedIds={[]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders selected count", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    expect(screen.getByText("2 document(s) selected")).toBeInTheDocument();
  });

  it("renders bulk action buttons", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    expect(screen.getByText("Bulk folder reassignment")).toBeInTheDocument();
    expect(screen.getByText("Bulk metadata edit")).toBeInTheDocument();
    expect(screen.getByText("Clear selection")).toBeInTheDocument();
  });

  it("opens folder modal when bulk folder button clicked", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    expect(screen.getByText("Bulk Folder Reassignment")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Example: Client Uploads / Q2")).toBeInTheDocument();
  });

  it("opens metadata modal when bulk metadata button clicked", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    expect(screen.getByText("Bulk Metadata Edit")).toBeInTheDocument();
  });

  it("shows warning when applying folder with empty value", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.click(screen.getByText("Apply Folder"));
    expect(mockOnToast).toHaveBeenCalledWith("warning", "Folder required", expect.any(String));
  });

  it("shows warning when applying metadata with no fields", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    fireEvent.click(screen.getByText("Apply Metadata"));
    expect(mockOnToast).toHaveBeenCalledWith("warning", "No bulk fields provided", expect.any(String));
  });

  it("calls bulkFolderAction on successful folder apply", async () => {
    mockBulkFolderAction.mockResolvedValue({ ok: true });
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.change(screen.getByPlaceholderText("Example: Client Uploads / Q2"), { target: { value: "New Folder" } });
    fireEvent.click(screen.getByText("Apply Folder"));
    await waitFor(() => {
      expect(mockBulkFolderAction).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockOnApplyFolderLocal).toHaveBeenCalledWith("New Folder", ["doc-1", "doc-2"]);
    });
  });

  it("calls bulkMetadataAction on successful metadata apply", async () => {
    mockBulkMetadataAction.mockResolvedValue({ ok: true });
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    const descriptionInput = screen.getByPlaceholderText("Leave blank to keep current descriptions");
    fireEvent.change(descriptionInput, { target: { value: "New description" } });
    fireEvent.click(screen.getByText("Apply Metadata"));
    await waitFor(() => {
      expect(mockBulkMetadataAction).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockOnApplyMetadataLocal).toHaveBeenCalledWith(
        { description: "New description" },
        ["doc-1", "doc-2"],
      );
    });
  });

  it("calls onClearSelection when clear selection button clicked", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear selection"));
    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it("closes folder modal on cancel", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Bulk Folder Reassignment")).not.toBeInTheDocument();
  });

  it("renders safe apply summary text in metadata modal", () => {
    render(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    const safeApplyTexts = screen.getAllByText(/Safe apply rules are enabled/);
    expect(safeApplyTexts.length).toBe(2);
  });
});
