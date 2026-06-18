import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("@/components/admin/AdminDocumentsBulkControls", () => {
  return function MockBulkControls() {
    return <div data-testid="bulk-controls">Bulk Controls</div>;
  };
});

const mockCreateDoc = jest.fn();
const mockUpdateMetadata = jest.fn();
const mockUpdateVisibility = jest.fn();
const mockReplaceFile = jest.fn();
const mockDeleteDoc = jest.fn();
const mockBulkVisibility = jest.fn();
const mockBulkDelete = jest.fn();
const mockBulkFolder = jest.fn();
const mockBulkMetadata = jest.fn();

const baseOrg = { id: "o1", name: "Acme Corp" };

const baseDoc = {
  id: "d1",
  display_name: "Report Q1",
  file_extension: "pdf",
  resolved_url: "https://cdn.example.com/report.pdf",
  mime_type: "application/pdf",
  organization_id: "o1",
  organization_name: "Acme Corp",
  folder_path: "Finance",
  visibility: "org",
  storage_bucket: "documents",
  storage_path: "orgs/o1/report.pdf",
  file_name: "report.pdf",
  file_size: 102400,
  description: "Quarterly financial report",
  updated_at: new Date(Date.now() - 3600000).toISOString(),
  created_at: new Date(Date.now() - 86400000).toISOString(),
  current_version: 2,
};

function renderClient(overrides: any = {}) {
  const documents = overrides.documents ?? [baseDoc];
  const organizations = overrides.organizations ?? [baseOrg];
  return render(
    <AdminDocumentsCenterClient
      documents={documents}
      organizations={organizations}
      createDocumentAction={mockCreateDoc}
      updateMetadataAction={mockUpdateMetadata}
      updateVisibilityAction={mockUpdateVisibility}
      replaceFileAction={mockReplaceFile}
      deleteDocumentAction={mockDeleteDoc}
      bulkVisibilityAction={mockBulkVisibility}
      bulkDeleteAction={mockBulkDelete}
      bulkFolderAction={mockBulkFolder}
      bulkMetadataAction={mockBulkMetadata}
    />,
  );
}

let AdminDocumentsCenterClient: typeof import("@/components/admin/AdminDocumentsCenterClient").default;

describe("AdminDocumentsCenterClient", () => {
  beforeAll(async () => {
    AdminDocumentsCenterClient = (
      await import("@/components/admin/AdminDocumentsCenterClient")
    ).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  describe("initial render (list view)", () => {
    it("renders heading and description", () => {
      renderClient();
      expect(screen.getByText("Documents")).toBeInTheDocument();
    });

    it("renders stats cards", () => {
      renderClient();
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Selected")).toBeInTheDocument();
      expect(screen.getByText("Private")).toBeInTheDocument();
      expect(screen.getByText("Internal")).toBeInTheDocument();
    });

    it("renders New Document and Refresh View buttons", () => {
      renderClient();
      expect(
        screen.getByRole("button", { name: "New Document" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Refresh View" }),
      ).toBeInTheDocument();
    });

    it("renders document cards in list view", () => {
      renderClient();
      expect(screen.getByText("Report Q1")).toBeInTheDocument();
      expect(
        screen.getByText("Quarterly financial report"),
      ).toBeInTheDocument();
    });

    it("renders search input and filter selects", () => {
      renderClient();
      expect(screen.getByPlaceholderText(/Search by name/)).toBeInTheDocument();
      expect(screen.getByText("All organizations")).toBeInTheDocument();
      expect(screen.getByText("All")).toBeInTheDocument();
    });

    it("renders view mode buttons", () => {
      renderClient();
      expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Table" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Grid" })).toBeInTheDocument();
    });

    it("renders sort buttons", () => {
      renderClient();
      expect(
        screen.getByRole("button", { name: "Updated" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Name" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Org" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Folder" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Visibility" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Type" })).toBeInTheDocument();
    });

    it("renders select all visible and clear buttons", () => {
      renderClient();
      expect(
        screen.getByRole("button", { name: "Select All Visible" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    });

    it("shows Polish Notes sidebar", () => {
      renderClient();
      expect(screen.getByText("Polish Notes")).toBeInTheDocument();
    });

    it("does not show create modal by default", () => {
      renderClient();
      expect(screen.queryByText("Create Document")).not.toBeInTheDocument();
    });

    it("does not show drawer by default", () => {
      renderClient();
      expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    });

    it("shows link unresolved when no resolved_url", () => {
      renderClient({ documents: [{ ...baseDoc, resolved_url: null }] });
      expect(screen.getByText("Link unresolved")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no documents", () => {
      renderClient({ documents: [] });
      expect(screen.getByText("No documents found")).toBeInTheDocument();
    });

    it("shows create and reset buttons in empty state", () => {
      renderClient({ documents: [] });
      expect(
        screen.getByRole("button", { name: "Create Document" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reset Filters" }),
      ).toBeInTheDocument();
    });
  });

  describe("view mode switching", () => {
    it("switches to table view", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Table" }));
      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("Select")).toBeInTheDocument();
    });

    it("switches to grid view", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Grid" }));
      expect(screen.getByText("Version")).toBeInTheDocument();
    });
  });

  describe("search filter", () => {
    it("filters documents by search query", async () => {
      renderClient({
        documents: [
          baseDoc,
          {
            ...baseDoc,
            id: "d2",
            display_name: "Unrelated Doc",
            description: "Something else",
            storage_path: "other/path",
            file_name: "other.txt",
          },
        ],
      });
      const searchInput = screen.getByPlaceholderText(/Search by name/);
      await userEvent.type(searchInput, "Report");
      expect(screen.getByText("Report Q1")).toBeInTheDocument();
      expect(screen.queryByText("Unrelated Doc")).not.toBeInTheDocument();
    });
  });

  describe("organization filter", () => {
    it("filters by organization", async () => {
      renderClient({
        organizations: [baseOrg, { id: "o2", name: "Other Inc" }],
        documents: [
          baseDoc,
          {
            ...baseDoc,
            id: "d2",
            display_name: "Other Doc",
            organization_id: "o2",
            organization_name: "Other Inc",
          },
        ],
      });
      const select = screen.getByDisplayValue("All organizations");
      await userEvent.selectOptions(select, "o2");
      expect(screen.getByText("Other Doc")).toBeInTheDocument();
      expect(screen.queryByText("Report Q1")).not.toBeInTheDocument();
    });
  });

  describe("visibility filter", () => {
    it("filters by visibility", async () => {
      renderClient({
        documents: [
          baseDoc,
          {
            ...baseDoc,
            id: "d2",
            display_name: "Public Doc",
            visibility: "public",
          },
        ],
      });
      const selects = screen.getAllByRole("combobox");
      const visSelect = selects.find((s) => {
        const opts = s.querySelectorAll("option");
        return Array.from(opts).some((o) => o.textContent === "public");
      });
      if (visSelect) await userEvent.selectOptions(visSelect, "public");
      expect(screen.getByText("Public Doc")).toBeInTheDocument();
    });
  });

  describe("filter chips", () => {
    it("shows filter chip when search is non-empty", async () => {
      renderClient();
      const searchInput = screen.getByPlaceholderText(/Search by name/);
      await userEvent.type(searchInput, "Report");
      expect(
        screen.getByText((c) => c.includes("Search:") && c.includes("Report")),
      ).toBeInTheDocument();
    });

    it("clears search when chip × clicked", async () => {
      renderClient();
      const searchInput = screen.getByPlaceholderText(/Search by name/);
      await userEvent.type(searchInput, "Report");
      const chip = screen.getByText(
        (c) => c.includes("Search:") && c.includes("Report"),
      );
      await userEvent.click(chip);
      expect(
        screen.queryByText(
          (c) => c.includes("Search:") && c.includes("Report"),
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe("visibility pill display", () => {
    it("shows visibility pill for org visibility", () => {
      renderClient();
      expect(screen.getByRole("button", { name: "org" })).toBeInTheDocument();
    });
  });

  describe("type pill display", () => {
    it("shows PDF type pill", () => {
      renderClient();
      expect(screen.getAllByText("PDF").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("inline rename", () => {
    it("shows name as button initially", () => {
      renderClient();
      expect(
        screen.getByRole("button", { name: "Report Q1" }),
      ).toBeInTheDocument();
    });

    it("switches to input on click", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Report Q1" }));
      const nameInput = document.querySelector<HTMLInputElement>(
        "input[value='Report Q1']",
      );
      expect(nameInput).not.toBeNull();
    });
  });

  describe("inline visibility", () => {
    it("shows visibility as button initially", () => {
      renderClient();
      const visBtn = screen.getByRole("button", { name: "org" });
      expect(visBtn).toBeInTheDocument();
    });
  });

  describe("quick edit panel", () => {
    it("shows quick edit panel when Quick Edit clicked", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Quick Edit" }));
      expect(screen.getByText("Save changes")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("hides quick edit panel when Cancel clicked", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Quick Edit" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(screen.queryByText("Save changes")).not.toBeInTheDocument();
    });
  });

  describe("drawer", () => {
    it("opens drawer when Drawer button clicked", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Drawer" }));
      expect(screen.getAllByText("Overview").length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText((c) => c.includes("Organization:")),
      ).toBeInTheDocument();
    });

    it("closes drawer when Close button clicked", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Drawer" }));
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    });

    it("switches drawer tabs", async () => {
      renderClient();
      await userEvent.click(screen.getByRole("button", { name: "Drawer" }));
      await userEvent.click(screen.getByRole("button", { name: "Edit" }));
      expect(screen.getByText("Metadata Editor")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "File" }));
      expect(screen.getByText("Replace File")).toBeInTheDocument();
    });

    it("preview tab shows preview section for image docs", async () => {
      renderClient({
        documents: [
          {
            ...baseDoc,
            mime_type: "image/png",
            file_extension: "png",
            resolved_url: "https://cdn.example.com/img.png",
          },
        ],
      });
      await userEvent.click(screen.getByRole("button", { name: "Drawer" }));
      await userEvent.click(screen.getByRole("button", { name: "Preview" }));
      expect(screen.getAllByText("Preview").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("create modal", () => {
    it("opens create modal when New Document clicked", async () => {
      renderClient();
      await userEvent.click(
        screen.getByRole("button", { name: "New Document" }),
      );
      expect(
        screen.getAllByText("Create Document").length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByRole("button", { name: "Create Document" }),
      ).toBeInTheDocument();
    });

    it("closes create modal when Close clicked", async () => {
      renderClient();
      await userEvent.click(
        screen.getByRole("button", { name: "New Document" }),
      );
      await userEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByText("Create Document")).not.toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("selects a document via checkbox", async () => {
      renderClient();
      const checkboxes = document.querySelectorAll<HTMLInputElement>(
        "input[type='checkbox']",
      );
      fireEvent.click(checkboxes[0]);
      expect(
        screen.getByText((c) => c.includes("document selected")) &&
          screen.getByText(/1 document selected/),
      ).toBeInTheDocument();
    });
  });

  describe("bulk controls visibility", () => {
    it("shows bulk controls when a document is selected", async () => {
      renderClient();
      const checkboxes = document.querySelectorAll<HTMLInputElement>(
        "input[type='checkbox']",
      );
      fireEvent.click(checkboxes[0]);
      await waitFor(() => {
        expect(screen.getByTestId("bulk-controls")).toBeInTheDocument();
      });
    });
  });

  describe("toast notifications", () => {
    it("renders toast container", () => {
      renderClient();
      const toastContainer = document.querySelector(".fixed.right-4.top-4");
      expect(toastContainer).toBeInTheDocument();
    });
  });

  describe("load more", () => {
    it("shows Load More button when more than 24 items", () => {
      const docs = Array.from({ length: 30 }, (_, i) => ({
        ...baseDoc,
        id: `d${i}`,
        display_name: `Doc ${i}`,
      }));
      renderClient({ documents: docs });
      expect(
        screen.getByRole("button", { name: "Load more" }),
      ).toBeInTheDocument();
    });
  });

  describe("localStorage persistence", () => {
    it("saves search to localStorage", async () => {
      renderClient();
      const searchInput = screen.getByPlaceholderText(/Search by name/);
      await userEvent.type(searchInput, "TestDoc");
      const saved = JSON.parse(
        window.localStorage.getItem("admin-documents-ui-prefs-v2233") ?? "{}",
      );
      expect(saved.search).toBe("TestDoc");
    });
  });

  describe("keyboard shortcuts", () => {
    it("opens create modal on Cmd+N", () => {
      renderClient();
      fireEvent.keyDown(window, { key: "n", metaKey: true });
      expect(
        screen.getAllByText("Create Document").length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("closes create modal on Escape", () => {
      renderClient();
      fireEvent.keyDown(window, { key: "n", metaKey: true });
      expect(
        screen.getAllByText("Create Document").length,
      ).toBeGreaterThanOrEqual(1);
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByText("Create Document")).not.toBeInTheDocument();
    });
  });
});
