"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createOnboardingAction(formData: FormData) {
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false as const, error: "No approved organization membership found." };
  }

  let created: { id: string };
  try {
    created = await api.clientOnboarding.create({
      organizationId: membership.organization_id,
      clientName: String(formData.get("clientName") || ""),
      clientDomain: String(formData.get("clientDomain") || "") || null,
      clientContactEmail: String(formData.get("clientContactEmail") || "") || null,
      clientContactPhone: String(formData.get("clientContactPhone") || "") || null,
      riskLevel: String(formData.get("riskLevel") || "medium"),
      discoveryNotes: String(formData.get("discoveryNotes") || "") || null,
      status: "discovery",
      phase: "discovery",
      m365SetupStatus: "not_started",
      m365Licenses: {},
      accessCollectionStatus: "not_started",
      accessCredentials: {},
      networkBaselineStatus: "not_started",
      networkScanResults: {},
      documentationStatus: "not_started",
      securityBaselineStatus: "not_started",
      securityFindings: [],
      supportHandoffStatus: "not_started",
    });
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create" };
  }

  revalidatePath("/portal/client-onboarding-command-center");
  // USE-P2-007: the redirect must run OUTSIDE the try/catch. `redirect()` throws
  // a NEXT_REDIRECT control-flow error; catching it here turned a successful
  // create into a cryptic "NEXT_REDIRECT" error and left the user on the form,
  // inviting duplicate submissions.
  redirect(`/portal/client-onboarding-command-center/${created.id}`);
}
