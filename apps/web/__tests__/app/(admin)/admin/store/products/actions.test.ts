import { jest } from "@jest/globals";

const mockCreateProduct = jest.fn();
const mockUpdateProduct = jest.fn();
const mockDeleteProduct = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  store: {
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
    deleteProduct: mockDeleteProduct,
  },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("product actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProductAction", () => {
    it("creates a product with parsed attributes and revalidates", async () => {
      const { createProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("name", "Secure Email");
      form.set("slug", "secure-email");
      form.set("categoryId", "cat-1");
      form.set("category", "Email");
      form.set("type", "service");
      form.set("status", "published");
      form.set("priceRange", "$100");
      form.set("pricingModel", "recurring_monthly");
      form.set("purchaseMode", "direct_checkout");
      form.set("display", "true");
      form.set("summary", "sum");
      form.set("marketingHeadline", "head");
      form.set("marketingCopy", "copy");
      form.set("tags", "a, b , c");
      form.set("riskLevel", "high");
      form.set("deliveryEffort", "complex");
      form.set("bundleEligible", "true");
      form.set("attributes", '{"intakeFields":[{"id":"f1"}]}'); 

      const result = await createProductAction({ ok: true }, form);

      expect(result.ok).toBe(true);
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Secure Email",
          slug: "secure-email",
          categoryId: "cat-1",
          tags: ["a", "b", "c"],
          display: true,
          attributes: expect.objectContaining({
            riskLevel: "high",
            deliveryEffort: "complex",
            bundleEligible: true,
            intakeFields: [{ id: "f1" }],
          }),
        }),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/products");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/products/secure-email");
    });

    it("handles missing optional flags and empty attributes", async () => {
      const { createProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("name", "X");
      form.set("slug", "x");
      form.set("display", "false");
      form.set("attributes", "");

      const result = await createProductAction({ ok: true }, form);

      expect(result.ok).toBe(true);
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ display: false, attributes: {} }),
      );
    });

    it("ignores malformed attribute JSON", async () => {
      const { createProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("name", "X");
      form.set("slug", "x");
      form.set("attributes", "{not json");

      const result = await createProductAction({ ok: true }, form);
      expect(result.ok).toBe(true);
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ attributes: {} }),
      );
    });

    it("returns error when create fails", async () => {
      mockCreateProduct.mockRejectedValueOnce(new Error("boom"));
      const { createProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("name", "X");
      form.set("slug", "x");
      const result = await createProductAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("boom");
    });
  });

  describe("updateProductAction", () => {
    it("returns error when id is missing", async () => {
      const { updateProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const result = await updateProductAction({ ok: true }, new FormData());
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing id");
      expect(mockUpdateProduct).not.toHaveBeenCalled();
    });

    it("applies provided simple fields, tags, display and attributes", async () => {
      const { updateProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("id", "prod-1");
      form.set("name", "Renamed");
      form.set("tags", "a, b");
      form.set("display", "true");
      form.set("riskLevel", "normal");
      form.set("attributes", "{}");

      const result = await updateProductAction({ ok: true }, form);

      expect(result.ok).toBe(true);
      expect(mockUpdateProduct).toHaveBeenCalledWith(
        "prod-1",
        expect.objectContaining({
          name: "Renamed",
          tags: ["a", "b"],
          display: true,
          attributes: { riskLevel: "normal" },
        }),
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/products");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/products/prod-1");
    });

    it("returns error when update fails", async () => {
      mockUpdateProduct.mockRejectedValueOnce(new Error("nope"));
      const { updateProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("id", "prod-1");
      const result = await updateProductAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("nope");
    });
  });

  describe("deleteProductAction", () => {
    it("returns error when id is missing", async () => {
      const { deleteProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const result = await deleteProductAction({ ok: true }, new FormData());
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing id");
      expect(mockDeleteProduct).not.toHaveBeenCalled();
    });

    it("deletes and revalidates", async () => {
      const { deleteProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("id", "prod-1");
      const result = await deleteProductAction({ ok: true }, form);
      expect(result.ok).toBe(true);
      expect(mockDeleteProduct).toHaveBeenCalledWith("prod-1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/products");
    });

    it("returns error when delete fails", async () => {
      mockDeleteProduct.mockRejectedValueOnce(new Error("gone"));
      const { deleteProductAction } = await import(
        "@/app/(admin)/admin/store/products/actions"
      );
      const form = new FormData();
      form.set("id", "prod-1");
      const result = await deleteProductAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("gone");
    });
  });
});
