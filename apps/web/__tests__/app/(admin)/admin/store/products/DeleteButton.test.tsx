import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockDeleteProduct = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: { deleteProduct: mockDeleteProduct },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import DeleteButton from "@/app/(admin)/admin/store/products/DeleteButton";

describe("Product DeleteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires confirmation then deletes", async () => {
    render(<DeleteButton id="prod-1" name="Secure Email" />);

    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByText("Confirm?")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteProduct).toHaveBeenCalledTimes(1));
    expect(mockDeleteProduct).toHaveBeenCalledWith("prod-1");
  });

  it("cancels confirmation", () => {
    render(<DeleteButton id="prod-1" name="Secure Email" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm?")).not.toBeInTheDocument();
  });

  it("shows an error when delete fails", async () => {
    mockDeleteProduct.mockRejectedValueOnce(new Error("delete failed"));
    render(<DeleteButton id="prod-1" name="Secure Email" />);
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(screen.getByText("delete failed")).toBeInTheDocument());
  });
});
