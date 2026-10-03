import { jest } from "@jest/globals";

const mockRetryDeadLetter = jest.fn();
const mockDeleteDeadLetter = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  webhooks: {
    retryDeadLetter: mockRetryDeadLetter,
    deleteDeadLetter: mockDeleteDeadLetter,
  },
});
const mockRevalidatePath = jest.fn();
const mockRequireAdminAccess = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

function form(id?: string): FormData {
  const data = new FormData();
  if (id !== undefined) data.set("id", id);
  return data;
}

describe("dead-letter actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  describe("retryDeadLetterAction", () => {
    it("retries the dead letter and revalidates the page", async () => {
      const { retryDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await retryDeadLetterAction(form("dl1"));

      expect(result).toEqual({ ok: true });
      expect(mockRetryDeadLetter).toHaveBeenCalledWith("dl1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/webhooks/dead-letters");
    });

    it("returns an error when the retry call fails", async () => {
      mockRetryDeadLetter.mockRejectedValueOnce(new Error("boom"));
      const { retryDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await retryDeadLetterAction(form("dl1"));

      expect(result).toEqual({ ok: false, error: "boom" });
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejects a missing id without calling the API", async () => {
      const { retryDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await retryDeadLetterAction(form());

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing dead-letter id.");
      expect(mockRetryDeadLetter).not.toHaveBeenCalled();
    });
  });

  describe("dismissDeadLetterAction", () => {
    it("dismisses the dead letter and revalidates the page", async () => {
      const { dismissDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await dismissDeadLetterAction(form("dl1"));

      expect(result).toEqual({ ok: true });
      expect(mockDeleteDeadLetter).toHaveBeenCalledWith("dl1");
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/webhooks/dead-letters");
    });

    it("returns an error when the dismiss call fails", async () => {
      mockDeleteDeadLetter.mockRejectedValueOnce(new Error("gone"));
      const { dismissDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await dismissDeadLetterAction(form("dl1"));

      expect(result).toEqual({ ok: false, error: "gone" });
    });

    it("rejects a missing id without calling the API", async () => {
      const { dismissDeadLetterAction } =
        await import("@/app/(admin)/admin/webhooks/dead-letters/actions");

      const result = await dismissDeadLetterAction(form());

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Missing dead-letter id.");
      expect(mockDeleteDeadLetter).not.toHaveBeenCalled();
    });
  });
});
