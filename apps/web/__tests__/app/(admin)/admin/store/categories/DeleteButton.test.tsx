import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockDeleteCategory = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: { deleteCategory: mockDeleteCategory },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import DeleteButton from "@/app/(admin)/admin/store/categories/DeleteButton";

describe("Category DeleteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires confirmation then deletes", async () => {
    render(<DeleteButton id="cat-1" name="Email" />);

    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Confirm?")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteCategory).toHaveBeenCalledTimes(1));
    expect(mockDeleteCategory).toHaveBeenCalledWith("cat-1");
  });

  it("cancels confirmation", () => {
    render(<DeleteButton id="cat-1" name="Email" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm?")).not.toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows an error when delete fails", async () => {
    mockDeleteCategory.mockRejectedValueOnce(new Error("delete failed"));
    render(<DeleteButton id="cat-1" name="Email" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(screen.getByText("delete failed")).toBeInTheDocument());
  });
});
