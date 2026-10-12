import { jest } from "@jest/globals";

const mockOnboardingCreate = jest.fn();
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    clientOnboarding: { create: mockOnboardingCreate },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: (...args: unknown[]) => mockGetApprovedMembership(...args),
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

function makeFormData() {
  const formData = new FormData();
  formData.set("clientName", "Acme Onboarding");
  formData.set("clientDomain", "acme.example");
  formData.set("riskLevel", "high");
  return formData;
}

describe("createOnboardingAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("navigates to the created record after a successful create (USE-P2-007)", async () => {
    mockOnboardingCreate.mockResolvedValue({ id: "rec-1" });
    const { createOnboardingAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/actions"
    );
    const { redirect } = await import("next/navigation");

    await createOnboardingAction(makeFormData());

    expect(mockOnboardingCreate).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", clientName: "Acme Onboarding" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/client-onboarding-command-center");
    expect(redirect).toHaveBeenCalledWith("/portal/client-onboarding-command-center/rec-1");
  });

  it("returns the create error without navigating when the API fails", async () => {
    mockOnboardingCreate.mockRejectedValue(new Error("Duplicate client"));
    const { createOnboardingAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/actions"
    );
    const { redirect } = await import("next/navigation");

    const result = await createOnboardingAction(makeFormData());

    expect(result).toEqual({ ok: false, error: "Duplicate client" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("fails closed without an approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { createOnboardingAction } = await import(
      "@/app/(portal)/portal/client-onboarding-command-center/actions"
    );

    const result = await createOnboardingAction(makeFormData());

    expect(result).toEqual({
      ok: false,
      error: "No approved organization membership found.",
    });
    expect(mockOnboardingCreate).not.toHaveBeenCalled();
  });
});
