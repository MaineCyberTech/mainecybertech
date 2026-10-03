import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { ToastProvider } from "@/components/ui/ToastProvider";

function renderBulk(ui: ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("AdminDocumentsBulkControls", () => {
  let AdminDocumentsBulkControls: typeof import("@/components/admin/AdminDocumentsBulkControls").default;

  const mockBulkFolderAction = jest.fn();
  const mockBulkMetadataAction = jest.fn();
  const mockOnApplyFolderLocal = jest.fn();
  const mockOnApplyMetadataLocal = jest.fn();
  const mockOnClearSelection = jest.fn();

  const defaultProps = {
    selectedIds: ["doc-1", "doc-2"],
    bulkFolderAction: mockBulkFolderAction,
    bulkMetadataAction: mockBulkMetadataAction,
    onApplyFolderLocal: mockOnApplyFolderLocal,
    onApplyMetadataLocal: mockOnApplyMetadataLocal,
    onClearSelection: mockOnClearSelection,
  };

  beforeAll(async () => {
    AdminDocumentsBulkControls = (await import("@/components/admin/AdminDocumentsBulkControls"))
      .default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders no controls when no items selected", () => {
    const { container } = renderBulk(
      <AdminDocumentsBulkControls {...defaultProps} selectedIds={[]} />,
    );
    expect(container.querySelector("section")).not.toBeInTheDocument();
    expect(screen.queryByText("Bulk folder reassignment")).not.toBeInTheDocument();
  });

  it("renders selected count", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    expect(screen.getByText("2 document(s) selected")).toBeInTheDocument();
  });

  it("renders bulk action buttons", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    expect(screen.getByText("Bulk folder reassignment")).toBeInTheDocument();
    expect(screen.getByText("Bulk metadata edit")).toBeInTheDocument();
    expect(screen.getByText("Clear selection")).toBeInTheDocument();
  });

  it("opens folder modal when bulk folder button clicked", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    expect(screen.getByText("Bulk Folder Reassignment")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Example: Client Uploads / Q2")).toBeInTheDocument();
  });

  it("opens metadata modal when bulk metadata button clicked", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    expect(screen.getByText("Bulk Metadata Edit")).toBeInTheDocument();
  });

  it("shows warning toast when applying folder with empty value", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.click(screen.getByText("Apply Folder"));
    expect(screen.getByText("Folder required")).toBeInTheDocument();
    expect(screen.getByText("Enter a non-empty folder path to apply.")).toBeInTheDocument();
  });

  it("shows warning toast when applying metadata with no fields", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    fireEvent.click(screen.getByText("Apply Metadata"));
    expect(screen.getByText("No bulk fields provided")).toBeInTheDocument();
    expect(
      screen.getByText("Safe apply rules skip blank values. Enter at least one non-empty field."),
    ).toBeInTheDocument();
  });

  it("calls bulkFolderAction on successful folder apply and shows a success toast", async () => {
    mockBulkFolderAction.mockResolvedValue({ ok: true });
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.change(screen.getByPlaceholderText("Example: Client Uploads / Q2"), {
      target: { value: "New Folder" },
    });
    fireEvent.click(screen.getByText("Apply Folder"));
    await waitFor(() => {
      expect(mockBulkFolderAction).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockOnApplyFolderLocal).toHaveBeenCalledWith("New Folder", ["doc-1", "doc-2"]);
    });
    expect(await screen.findByText("Folder reassigned")).toBeInTheDocument();
    expect(screen.getByText("2 document(s) moved to New Folder.")).toBeInTheDocument();
  });

  it("calls bulkMetadataAction on successful metadata apply", async () => {
    mockBulkMetadataAction.mockResolvedValue({ ok: true });
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    const descriptionInput = screen.getByPlaceholderText(
      "Leave blank to keep current descriptions",
    );
    fireEvent.change(descriptionInput, { target: { value: "New description" } });
    fireEvent.click(screen.getByText("Apply Metadata"));
    await waitFor(() => {
      expect(mockBulkMetadataAction).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockOnApplyMetadataLocal).toHaveBeenCalledWith({ description: "New description" }, [
        "doc-1",
        "doc-2",
      ]);
    });
  });

  it("calls onClearSelection when clear selection button clicked", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear selection"));
    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  it("closes folder modal on cancel", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk folder reassignment"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Bulk Folder Reassignment")).not.toBeInTheDocument();
  });

  it("renders safe apply summary text in metadata modal", () => {
    renderBulk(<AdminDocumentsBulkControls {...defaultProps} />);
    fireEvent.click(screen.getByText("Bulk metadata edit"));
    const safeApplyTexts = screen.getAllByText(/Safe apply rules are enabled/);
    expect(safeApplyTexts.length).toBe(2);
  });
});
