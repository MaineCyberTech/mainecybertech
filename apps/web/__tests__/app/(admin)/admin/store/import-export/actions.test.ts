import {
  importProductsAction,
  importCategoriesAction,
} from "@/app/(admin)/admin/store/import-export/actions";

const mockGetProductById = jest.fn();
const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockListCategories = jest.fn();
const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockRequireAdminAccess = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: {
      getProductById: mockGetProductById,
      createProduct: mockCreateProduct,
      updateProduct: mockUpdateProduct,
      listCategories: mockListCategories,
      createCategory: mockCreateCategory,
      updateCategory: mockUpdateCategory,
    },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: () => mockRequireAdminAccess(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

function formWith(payload: unknown): FormData {
  const formData = new FormData();
  formData.set("payload", JSON.stringify(payload));
  return formData;
}

describe("importProductsAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProductById.mockRejectedValue(new Error("not found"));
    mockCreateProduct.mockResolvedValue({ id: "p-1" });
    mockUpdateProduct.mockResolvedValue({ id: "p-1" });
  });

  it("creates products that do not exist yet", async () => {
    const result = await importProductsAction(
      formWith([
        { id: "p-1", slug: "one", name: "One", categoryId: "c-1", display: "false" },
        { id: "p-2", slug: "two", name: "Two" },
      ]),
    );

    expect(result.ok).toBe(true);
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(mockCreateProduct).toHaveBeenCalledTimes(2);
    // CSV-sourced booleans are coerced, not silently flipped to true.
    expect(mockCreateProduct).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p-1", display: false }),
    );
  });

  it("updates products that already exist", async () => {
    mockGetProductById.mockResolvedValue({ id: "p-1" });

    const result = await importProductsAction(formWith([{ id: "p-1", slug: "one", name: "One" }]));

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(mockUpdateProduct).toHaveBeenCalledWith("p-1", expect.objectContaining({ name: "One" }));
  });

  it("reports rows missing required fields", async () => {
    const result = await importProductsAction(formWith([{ id: "p-1" }]));

    expect(result.ok).toBe(false);
    expect(result.failed?.[0]).toMatch(/required/);
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it("reports per-row API failures without aborting the batch", async () => {
    mockCreateProduct
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce({ id: "p-2" });

    const result = await importProductsAction(
      formWith([
        { id: "p-1", slug: "one", name: "One" },
        { id: "p-2", slug: "two", name: "Two" },
      ]),
    );

    expect(result.created).toBe(1);
    expect(result.failed?.[0]).toMatch(/db down/);
  });

  it("rejects invalid JSON", async () => {
    const formData = new FormData();
    formData.set("payload", "{not json");

    const result = await importProductsAction(formData);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not valid JSON/i);
  });
});

describe("importCategoriesAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCategories.mockResolvedValue([{ id: "c-1", slug: "one", name: "One" }]);
    mockCreateCategory.mockResolvedValue({ id: "c-2" });
    mockUpdateCategory.mockResolvedValue({ id: "c-1" });
  });

  it("creates new and updates existing categories", async () => {
    const result = await importCategoriesAction(
      formWith([
        { id: "c-1", slug: "one", name: "One" },
        { id: "c-2", slug: "two", name: "Two" },
      ]),
    );

    expect(result.ok).toBe(true);
    expect(result.updated).toBe(1);
    expect(result.created).toBe(1);
    expect(mockUpdateCategory).toHaveBeenCalledWith(
      "c-1",
      expect.objectContaining({ name: "One" }),
    );
    expect(mockCreateCategory).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c-2", name: "Two" }),
    );
  });
});
