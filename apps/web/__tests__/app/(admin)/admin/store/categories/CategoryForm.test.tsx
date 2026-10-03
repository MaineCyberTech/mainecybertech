import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockCreateCategory = jest.fn().mockResolvedValue(undefined);
const mockUpdateCategory = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: {
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
    },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import CategoryForm from "@/app/(admin)/admin/store/categories/CategoryForm";

describe("CategoryForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the create modal and submits a new category", async () => {
    render(
      <CategoryForm mode="create">
        <button type="button">New Category</button>
      </CategoryForm>,
    );

    fireEvent.click(screen.getByText("New Category"));
    expect(screen.getByText("Create Category")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Email" } });
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "email" } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledTimes(1));
    expect(mockCreateCategory).toHaveBeenCalledWith({
      name: "Email",
      slug: "email",
      description: "",
      productIds: [],
    });
  });

  it("shows an error and keeps the modal open on failure", async () => {
    mockCreateCategory.mockRejectedValueOnce(new Error("create failed"));
    render(
      <CategoryForm mode="create">
        <button type="button">New Category</button>
      </CategoryForm>,
    );

    fireEvent.click(screen.getByText("New Category"));
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(screen.getByText("create failed")).toBeInTheDocument());
    expect(screen.getByText("Create Category")).toBeInTheDocument();
  });

  it("submits an edit with the category id", async () => {
    render(
      <CategoryForm
        mode="edit"
        category={{ id: "cat-1", name: "Email", slug: "email", description: "d", productIds: [] } as any}
      >
        <button type="button">Edit</button>
      </CategoryForm>,
    );

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Edit Category")).toBeInTheDocument();

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockUpdateCategory).toHaveBeenCalledTimes(1));
    expect(mockUpdateCategory).toHaveBeenCalledWith(
      "cat-1",
      expect.objectContaining({ name: "Email" }),
    );
  });
});
