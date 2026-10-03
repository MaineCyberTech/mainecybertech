import { render, screen } from "@testing-library/react";
import HasPermission from "@/components/HasPermission";

const mockCan = jest.fn();
jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({
    can: (...args: any[]) => mockCan(...args),
  }),
}));

describe("HasPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when the permission is granted", () => {
    mockCan.mockReturnValue(true);
    render(
      <HasPermission module="tickets" action="create">
        <button>New Ticket</button>
      </HasPermission>,
    );
    expect(screen.getByText("New Ticket")).toBeInTheDocument();
    expect(mockCan).toHaveBeenCalledWith("tickets", "create");
  });

  it("hides children when the permission is denied", () => {
    mockCan.mockReturnValue(false);
    render(
      <HasPermission module="tickets" action="delete">
        <button>Delete</button>
      </HasPermission>,
    );
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("defaults to the view action", () => {
    mockCan.mockReturnValue(true);
    render(
      <HasPermission module="documents">
        <span>documents list</span>
      </HasPermission>,
    );
    expect(mockCan).toHaveBeenCalledWith("documents", "view");
  });

  it("renders fallback when permission is denied", () => {
    mockCan.mockReturnValue(false);
    render(
      <HasPermission module="users" action="delete" fallback={<span>No access</span>}>
        <button>Delete</button>
      </HasPermission>,
    );
    expect(screen.getByText("No access")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
