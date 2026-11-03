import { jest } from "@jest/globals";

const mockCreateOnboarding = jest.fn();
const mockCreateForm = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn(() => ({
    clientOnboarding: { create: mockCreateOnboarding },
    dynamicForms: { create: mockCreateForm },
  })),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: jest.fn().mockResolvedValue({ organization_id: "org-1" }),
}));

import { createOnboardingAction } from "@/app/(portal)/portal/client-onboarding-command-center/actions";
import { createFormAction } from "@/app/(portal)/portal/dynamic-client-forms-builder/actions";

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("portal create actions preserve NEXT_REDIRECT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateOnboarding.mockResolvedValue({ id: "onboarding-1" });
    mockCreateForm.mockResolvedValue({ id: "form-1" });
  });

  it("rethrows the redirect from onboarding creation", async () => {
    await expect(
      createOnboardingAction(
        formData({
          clientName: "New Client",
          clientDomain: "client.example",
          riskLevel: "low",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockCreateOnboarding).toHaveBeenCalledTimes(1);
  });

  it("rethrows the redirect from form creation", async () => {
    await expect(
      createFormAction(
        formData({
          title: "Access Request",
          formType: "access_request",
          fields: "[]",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(mockCreateForm).toHaveBeenCalledTimes(1);
  });
});
