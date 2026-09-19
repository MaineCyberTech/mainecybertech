import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockCreateProduct = jest.fn().mockResolvedValue(undefined);
const mockUpdateProduct = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: {
      createProduct: mockCreateProduct,
      updateProduct: mockUpdateProduct,
    },
  }),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import ProductForm from "@/app/(admin)/admin/store/products/ProductForm";

describe("ProductForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens the create modal and submits a new product", async () => {
    render(
      <ProductForm mode="create">
        <button type="button">New Product</button>
      </ProductForm>,
    );

    fireEvent.click(screen.getByText("New Product"));
    expect(screen.getByText("Create Product")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Secure Email" } });
    fireEvent.change(screen.getByLabelText("Slug"), { target: { value: "secure-email" } });

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockCreateProduct).toHaveBeenCalledTimes(1));
    expect(mockCreateProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Secure Email",
        slug: "secure-email",
      }),
    );
  });

  it("shows an error on failure", async () => {
    mockCreateProduct.mockRejectedValueOnce(new Error("create failed"));
    render(
      <ProductForm mode="create">
        <button type="button">New Product</button>
      </ProductForm>,
    );

    fireEvent.click(screen.getByText("New Product"));
    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(screen.getByText("create failed")).toBeInTheDocument());
  });

  it("submits an edit with the product id", async () => {
    render(
      <ProductForm
        mode="edit"
        product={{ id: "prod-1", name: "Secure Email", slug: "secure-email" } as any}
      >
        <button type="button">Edit</button>
      </ProductForm>,
    );

    fireEvent.click(screen.getByText("Edit"));
    expect(screen.getByText("Edit Product")).toBeInTheDocument();

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => expect(mockUpdateProduct).toHaveBeenCalledTimes(1));
    expect(mockUpdateProduct).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({ name: "Secure Email" }),
    );
  });
});
