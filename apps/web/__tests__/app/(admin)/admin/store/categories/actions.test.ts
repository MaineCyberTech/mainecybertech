import { jest } from "@jest/globals";

const mockCreateCategory = jest.fn();
const mockUpdateCategory = jest.fn();
const mockDeleteCategory = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  store: {
    createCategory: mockCreateCategory,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
  },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("category actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createCategoryAction", () => {
    it("creates a category and revalidates", async () => {
      const { createCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("name", "Email");
      form.set("slug", "email");
      form.set("description", "desc");
      form.set("productIds", "p1, p2 , , p3");

      const result = await createCategoryAction({ ok: true }, form);

      expect(result.ok).toBe(true);
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: "Email",
        slug: "email",
        description: "desc",
        productIds: ["p1", "p2", "p3"],
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/categories");
    });

    it("returns error when create fails", async () => {
      mockCreateCategory.mockRejectedValueOnce(new Error("boom"));
      const { createCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("name", "Email");
      form.set("slug", "email");

      const result = await createCategoryAction({ ok: true }, form);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("boom");
    });
  });

  describe("updateCategoryAction", () => {
    it("returns error when id is missing", async () => {
      const { updateCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      const result = await updateCategoryAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing id");
      expect(mockUpdateCategory).not.toHaveBeenCalled();
    });

    it("applies only provided fields", async () => {
      const { updateCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("id", "cat-1");
      form.set("name", "New Name");
      form.set("productIds", "");

      const result = await updateCategoryAction({ ok: true }, form);

      expect(result.ok).toBe(true);
      expect(mockUpdateCategory).toHaveBeenCalledWith("cat-1", {
        name: "New Name",
        productIds: [],
      });
    });

    it("returns error when update fails", async () => {
      mockUpdateCategory.mockRejectedValueOnce(new Error("nope"));
      const { updateCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("id", "cat-1");
      const result = await updateCategoryAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("nope");
    });
  });

  describe("deleteCategoryAction", () => {
    it("returns error when id is missing", async () => {
      const { deleteCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      const result = await deleteCategoryAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing id");
      expect(mockDeleteCategory).not.toHaveBeenCalled();
    });

    it("deletes and revalidates", async () => {
      const { deleteCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("id", "cat-1");
      const result = await deleteCategoryAction({ ok: true }, form);
      expect(result.ok).toBe(true);
      expect(mockDeleteCategory).toHaveBeenCalledWith("cat-1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/store/categories");
    });

    it("returns error when delete fails", async () => {
      mockDeleteCategory.mockRejectedValueOnce(new Error("gone"));
      const { deleteCategoryAction } = await import(
        "@/app/(admin)/admin/store/categories/actions"
      );
      const form = new FormData();
      form.set("id", "cat-1");
      const result = await deleteCategoryAction({ ok: true }, form);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("gone");
    });
  });
});
