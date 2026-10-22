import { jest } from "@jest/globals";

const createApproval = jest.fn();
const createChange = jest.fn();
const createDns = jest.fn();
const createIdentity = jest.fn();
const createOffboarding = jest.fn();
const createInsurance = jest.fn();

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn(() => ({
    approvals: { create: createApproval },
    governance: { changes: { create: createChange } },
    final: { dnsChanges: { create: createDns } },
    securitySuite: { idVerify: { create: createIdentity } },
    securityOps: { offboarding: { create: createOffboarding } },
    insuranceBinder: { create: createInsurance },
  })),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: jest.fn().mockResolvedValue({ organization_id: "org-1" }),
}));

import { createApprovalAction } from "@/app/(portal)/portal/approvals/actions";
import { createChangeRequestAction } from "@/app/(portal)/portal/change-requests/actions";
import { createDnsChangeAction } from "@/app/(portal)/portal/dns-changes/actions";
import { requestIdentityVerificationAction } from "@/app/(portal)/portal/identity-verification/actions";
import { requestOffboardingAction } from "@/app/(portal)/portal/offboarding/actions";
import { addInsuranceEvidenceAction } from "@/app/(portal)/portal/insurance-binder/actions";

function formData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("portal request actions preserve NEXT_REDIRECT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const fn of [
      createApproval,
      createChange,
      createDns,
      createIdentity,
      createOffboarding,
      createInsurance,
    ]) {
      fn.mockResolvedValue({ id: "record-1" });
    }
  });

  it("approval", async () => {
    await expect(
      createApprovalAction(
        formData({ requestSubject: "Need access", requestType: "access_request" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createApproval).toHaveBeenCalledWith(
      expect.objectContaining({ visibility: "client_visible", requestSubject: "Need access" }),
    );
  });

  it("change request", async () => {
    await expect(
      createChangeRequestAction(formData({ title: "Firewall change", changeType: "standard" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createChange).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", title: "Firewall change" }),
    );
  });

  it("dns change", async () => {
    await expect(
      createDnsChangeAction(formData({ domain: "example.com", changeType: "a" })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createDns).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", domain: "example.com" }),
    );
  });

  it("identity verification", async () => {
    await expect(
      requestIdentityVerificationAction(
        formData({ requestorName: "Alex", verificationMethod: "callback" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(createIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", requestorName: "Alex" }),
    );
  });

  it("offboarding", async () => {
    await expect(requestOffboardingAction(formData({ employeeName: "Sam Lee" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(createOffboarding).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", employeeName: "Sam Lee" }),
    );
  });

  it("insurance evidence", async () => {
    await expect(addInsuranceEvidenceAction(formData({ title: "Cyber policy" }))).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(createInsurance).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", title: "Cyber policy" }),
    );
  });
});
