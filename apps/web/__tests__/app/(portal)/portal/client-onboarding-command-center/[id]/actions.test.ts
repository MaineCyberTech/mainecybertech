import { jest } from "@jest/globals";

const mockUpdateChecklistItem = jest.fn();
const mockUsersMe = jest.fn();
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    clientOnboarding: { updateChecklistItem: mockUpdateChecklistItem },
    users: { me: mockUsersMe },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: (...args: unknown[]) => mockGetApprovedMembership(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("toggleChecklistItemAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockUsersMe.mockResolvedValue({ userId: "user-1" });
  });

  it("completes a checklist item and attributes the completer (USE-P2-008)", async () => {
    mockUpdateChecklistItem.mockResolvedValue({ id: "item-1", is_completed: true });
    const { toggleChecklistItemAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/[id]/actions"
    );

    const result = await toggleChecklistItemAction("rec-1", "item-1", true);

    expect(result).toEqual({ ok: true });
    expect(mockUpdateChecklistItem).toHaveBeenCalledWith("rec-1", "item-1", {
      isCompleted: true,
      completedBy: "user-1",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/portal/client-onboarding-command-center/rec-1",
    );
  });

  it("uncompletes a checklist item", async () => {
    mockUpdateChecklistItem.mockResolvedValue({ id: "item-1", is_completed: false });
    const { toggleChecklistItemAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/[id]/actions"
    );

    const result = await toggleChecklistItemAction("rec-1", "item-1", false);

    expect(result).toEqual({ ok: true });
    expect(mockUpdateChecklistItem).toHaveBeenCalledWith("rec-1", "item-1", {
      isCompleted: false,
      completedBy: "user-1",
    });
  });

  it("returns the API error instead of throwing", async () => {
    mockUpdateChecklistItem.mockRejectedValue(new Error("Forbidden"));
    const { toggleChecklistItemAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/[id]/actions"
    );

    const result = await toggleChecklistItemAction("rec-1", "item-1", true);

    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("fails closed without an approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { toggleChecklistItemAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/[id]/actions"
    );

    const result = await toggleChecklistItemAction("rec-1", "item-1", true);

    expect(result.ok).toBe(false);
    expect(mockUpdateChecklistItem).not.toHaveBeenCalled();
  });
});
