"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getClientEnv } from "@/lib/env";

export async function createAsset(formData: FormData) {
  const api = getApiClient();
  const orgId = String(formData.get("organizationId") || "");
  try {
    await api.assets.create({
      organizationId: orgId,
      name: String(formData.get("name") || ""),
      assetType: String(formData.get("assetType") || "hardware"),
      make: String(formData.get("make") || ""),
      model: String(formData.get("model") || ""),
      serialNumber: String(formData.get("serialNumber") || ""),
      assetTag: String(formData.get("assetTag") || ""),
      purchaseDate: String(formData.get("purchaseDate") || ""),
      warrantyExpires: String(formData.get("warrantyExpires") || ""),
      location: String(formData.get("location") || ""),
    });
    revalidatePath("/admin/assets");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createBreakGlass(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.breakGlass.create({
      organizationId: String(formData.get("organizationId") || ""),
      accountName: String(formData.get("accountName") || ""),
      system: String(formData.get("system") || ""),
      custodianName: String(formData.get("custodianName") || ""),
      accessProcedure: String(formData.get("accessProcedure") || ""),
    });
    revalidatePath("/admin/break-glass");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createDmarc(formData: FormData) {
  const api = getApiClient();
  try {
    await api.batch.dmarc.create({
      organizationId: String(formData.get("organizationId") || ""),
      domain: String(formData.get("domain") || ""),
    });
    revalidatePath("/admin/dmarc");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createDomainMonitor(formData: FormData) {
  const api = getApiClient();
  try {
    await api.domainMonitors.create({
      organizationId: String(formData.get("organizationId") || ""),
      domain: String(formData.get("domain") || ""),
      displayName: String(formData.get("displayName") || ""),
    });
    revalidatePath("/admin/domain-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createEndpoint(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.endpoints.create({
      organizationId: String(formData.get("organizationId") || ""),
      deviceGroup: String(formData.get("deviceGroup") || ""),
      totalEndpoints: Number(formData.get("totalEndpoints") || 0),
    });
    revalidatePath("/admin/endpoint-security");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createFileRequest(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fileRequests.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
    });
    revalidatePath("/admin/file-requests");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createFinding(formData: FormData) {
  const api = getApiClient();
  try {
    await api.findings.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      severity: String(formData.get("severity") || "p2"),
      source: String(formData.get("source") || "security"),
      description: String(formData.get("description") || ""),
    });
    revalidatePath("/admin/findings");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createIdVerify(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.idVerify.create({
      organizationId: String(formData.get("organizationId") || ""),
      requestorName: String(formData.get("requestorName") || ""),
      verificationMethod: String(formData.get("verificationMethod") || ""),
    });
    revalidatePath("/admin/id-verify");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createIncident(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.incidents.create({
      organizationId: String(formData.get("organizationId") || ""),
      incidentType: String(formData.get("incidentType") || "security"),
      title: String(formData.get("title") || ""),
      severity: String(formData.get("severity") || "medium"),
      description: String(formData.get("description") || ""),
    });
    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createLicense(formData: FormData) {
  const api = getApiClient();
  try {
    await api.batch.licenses.create({
      organizationId: String(formData.get("organizationId") || ""),
      vendor: String(formData.get("vendor") || ""),
      productName: String(formData.get("productName") || ""),
      totalSeats: Number(formData.get("totalSeats") || 0),
      assignedSeats: Number(formData.get("assignedSeats") || 0),
      annualCost: Number(formData.get("annualCost") || 0),
    });
    revalidatePath("/admin/licenses");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createM365Assessment(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.m365.create({
      organizationId: String(formData.get("organizationId") || ""),
      tenantDomain: String(formData.get("tenantDomain") || ""),
    });
    revalidatePath("/admin/m365-hardening");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createOffboarding(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.offboarding.create({
      organizationId: String(formData.get("organizationId") || ""),
      employeeName: String(formData.get("employeeName") || ""),
      employeeEmail: String(formData.get("employeeEmail") || ""),
      department: String(formData.get("department") || ""),
      offboardingDate: String(formData.get("offboardingDate") || ""),
    });
    revalidatePath("/admin/offboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createOnboarding(formData: FormData) {
  const api = getApiClient();
  try {
    await api.clientOnboarding.create({
      organizationId: String(formData.get("organizationId") || ""),
      clientName: String(formData.get("clientName") || ""),
      clientDomain: String(formData.get("clientDomain") || "") || null,
      clientContactEmail: String(formData.get("clientContactEmail") || "") || null,
      clientContactPhone: String(formData.get("clientContactPhone") || "") || null,
      riskLevel: String(formData.get("riskLevel") || "medium"),
      discoveryNotes: String(formData.get("notes") || "") || null,
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
    revalidatePath("/admin/onboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createPatchGroup(formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.patchCompliance.create({
      organizationId: String(formData.get("organizationId") || ""),
      deviceGroup: String(formData.get("deviceGroup") || ""),
      totalDevices: Number(formData.get("totalDevices") || 0),
      patchedDevices: Number(formData.get("patchedDevices") || 0),
    });
    revalidatePath("/admin/patch-compliance");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createService(formData: FormData) {
  const api = getApiClient();
  try {
    await api.serviceCatalog.create({
      organizationId: String(formData.get("organizationId") || ""),
      name: String(formData.get("name") || ""),
      category: String(formData.get("category") || "managed_services"),
      basePrice: Number(formData.get("basePrice") || 0),
      unit: String(formData.get("unit") || "per_user"),
      billingModel: String(formData.get("billingModel") || "monthly"),
    });
    revalidatePath("/admin/service-catalog");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createStatusItem(formData: FormData) {
  const api = getApiClient();
  try {
    await api.batch.status.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      severity: String(formData.get("severity") || "info"),
      isPublic: formData.get("isPublic") === "on",
    });
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createVendorContract(formData: FormData) {
  const api = getApiClient();
  try {
    await api.vendors.contracts.create({
      organizationId: String(formData.get("organizationId") || ""),
      vendorName: String(formData.get("vendorName") || ""),
      serviceName: String(formData.get("serviceName") || ""),
      renewalDate: String(formData.get("renewalDate") || ""),
      contractValue: Number(formData.get("contractValue") || 0),
    });
    revalidatePath("/admin/vendor-contracts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createVendorContact(formData: FormData) {
  const api = getApiClient();
  try {
    await api.vendors.contacts.create({
      organizationId: String(formData.get("organizationId") || ""),
      vendorName: String(formData.get("vendorName") || ""),
      contactName: String(formData.get("contactName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
    });
    revalidatePath("/admin/vendor-contacts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createWebsiteMonitor(formData: FormData) {
  const api = getApiClient();
  try {
    await api.batch.websiteMonitors.create({
      organizationId: String(formData.get("organizationId") || ""),
      url: String(formData.get("url") || ""),
      displayName: String(formData.get("displayName") || ""),
    });
    revalidatePath("/admin/website-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Field Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createIsp(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.isp.create({
      organizationId: String(formData.get("organizationId") || ""),
      clientName: String(formData.get("clientName") || ""),
      currentProvider: String(formData.get("currentProvider") || ""),
      services: String(formData.get("services") || ""),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/field-services/isp");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createUnifi(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.unifi.create({
      organizationId: String(formData.get("organizationId") || ""),
      siteName: String(formData.get("siteName") || ""),
      siteAddress: String(formData.get("siteAddress") || ""),
      accessPoints: Number(formData.get("accessPoints") || 0),
      switches: Number(formData.get("switches") || 0),
      cameras: Number(formData.get("cameras") || 0),
      cableRunsEstimated: Number(formData.get("cableRunsEstimated") || 0),
      poeBudgetWatts: Number(formData.get("poeBudgetWatts") || 0),
    });
    revalidatePath("/admin/field-services/unifi");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createPortMap(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.portMaps.create({
      organizationId: String(formData.get("organizationId") || ""),
      switchName: String(formData.get("switchName") || ""),
      portNumber: Number(formData.get("portNumber") || 0),
      vlanId: Number(formData.get("vlanId") || 0),
      vlanName: String(formData.get("vlanName") || ""),
      connectedDevice: String(formData.get("connectedDevice") || ""),
      deviceType: String(formData.get("deviceType") || ""),
    });
    revalidatePath("/admin/field-services/port-maps");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createCameraCalc(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.camera.create({
      organizationId: String(formData.get("organizationId") || ""),
      siteName: String(formData.get("siteName") || ""),
      cameraCount: Number(formData.get("cameraCount") || 0),
      avgBitrateMbps: Number(formData.get("avgBitrateMbps") || 0),
      resolution: String(formData.get("resolution") || ""),
      retentionDays: Number(formData.get("retentionDays") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/field-services/camera-calc");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createStaging(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.staging.create({
      organizationId: String(formData.get("organizationId") || ""),
      deviceType: String(formData.get("deviceType") || ""),
      deviceName: String(formData.get("deviceName") || ""),
      serialNumber: String(formData.get("serialNumber") || ""),
      assetTag: String(formData.get("assetTag") || ""),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/field-services/staging");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createNetworkDiagram(formData: FormData) {
  const api = getApiClient();
  try {
    await api.fieldServices.networkDiagrams.create({
      organizationId: String(formData.get("organizationId") || ""),
      siteName: String(formData.get("siteName") || ""),
      deviceCount: Number(formData.get("deviceCount") || 0),
      vlanCount: Number(formData.get("vlanCount") || 0),
      wanCount: Number(formData.get("wanCount") || 0),
      wirelessZones: Number(formData.get("wirelessZones") || 0),
      cameraZones: Number(formData.get("cameraZones") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/field-services/network-diagrams");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Edu-Automation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createSop(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.sop.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      sopNumber: String(formData.get("sopNumber") || ""),
      category: String(formData.get("category") || ""),
      version: String(formData.get("version") || ""),
      content: String(formData.get("content") || ""),
    });
    revalidatePath("/admin/edu-automation/sop");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createCompliance(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.compliance.create({
      organizationId: String(formData.get("organizationId") || ""),
      framework: String(formData.get("framework") || ""),
      controlId: String(formData.get("controlId") || ""),
      controlDescription: String(formData.get("controlDescription") || ""),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/edu-automation/compliance");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createInsurance(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.insurance.create({
      organizationId: String(formData.get("organizationId") || ""),
      category: String(formData.get("category") || ""),
      evidenceDescription: String(formData.get("evidenceDescription") || ""),
      evidenceStatus: String(formData.get("evidenceStatus") || ""),
      documentReference: String(formData.get("documentReference") || ""),
      renewalDate: String(formData.get("renewalDate") || ""),
    });
    revalidatePath("/admin/edu-automation/insurance");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createAiPolicy(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.aiPolicy.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      dataHandlingRules: String(formData.get("dataHandlingRules") || ""),
      employeeGuidance: String(formData.get("employeeGuidance") || ""),
    });
    revalidatePath("/admin/edu-automation/ai-policy");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createKb(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.kb.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      category: String(formData.get("category") || ""),
    });
    revalidatePath("/admin/edu-automation/kb");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createTraining(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.training.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || ""),
      durationMinutes: Number(formData.get("durationMinutes") || 0),
    });
    revalidatePath("/admin/edu-automation/training");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createPhishing(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.phishing.create({
      organizationId: String(formData.get("organizationId") || ""),
      campaignName: String(formData.get("campaignName") || ""),
      targetCount: Number(formData.get("targetCount") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/edu-automation/phishing");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createScorecard(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.scorecards.create({
      organizationId: String(formData.get("organizationId") || ""),
      category: String(formData.get("category") || ""),
      score: Number(formData.get("score") || 0),
      badge: String(formData.get("badge") || ""),
    });
    revalidatePath("/admin/edu-automation/scorecards");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createAutomation(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.automation.create({
      organizationId: String(formData.get("organizationId") || ""),
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      scriptType: String(formData.get("scriptType") || ""),
      triggerType: String(formData.get("triggerType") || ""),
    });
    revalidatePath("/admin/edu-automation/automation");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createPowerShell(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.powershell.create({
      organizationId: String(formData.get("organizationId") || ""),
      name: String(formData.get("name") || ""),
      scriptContent: String(formData.get("scriptContent") || ""),
    });
    revalidatePath("/admin/edu-automation/powershell");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createKbGen(formData: FormData) {
  const api = getApiClient();
  try {
    await api.eduAutomation.kbGenerator.create({
      organizationId: String(formData.get("organizationId") || ""),
      sourceTitle: String(formData.get("sourceTitle") || ""),
      generatedContent: String(formData.get("generatedContent") || ""),
    });
    revalidatePath("/admin/edu-automation/kb-generator");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Final (More Tools) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createSharePoint(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.sharepoint.create({
      organizationId: String(formData.get("organizationId") || ""),
      siteName: String(formData.get("siteName") || ""),
      teamName: String(formData.get("teamName") || ""),
      owner: String(formData.get("owner") || ""),
      sensitivityLabel: String(formData.get("sensitivityLabel") || ""),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/final/sharepoint");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createDeviceProfile(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.deviceProfiles.create({
      organizationId: String(formData.get("organizationId") || ""),
      profileName: String(formData.get("profileName") || ""),
      deviceType: String(formData.get("deviceType") || ""),
      os: String(formData.get("os") || ""),
      description: String(formData.get("description") || ""),
    });
    revalidatePath("/admin/final/device-profiles");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createSaasAudit(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.saasAudit.create({
      organizationId: String(formData.get("organizationId") || ""),
      vendorName: String(formData.get("vendorName") || ""),
      serviceName: String(formData.get("serviceName") || ""),
      monthlyCost: Number(formData.get("monthlyCost") || 0),
      annualCost: Number(formData.get("annualCost") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/final/saas-audit");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createProcurement(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.procurement.create({
      organizationId: String(formData.get("organizationId") || ""),
      vendorName: String(formData.get("vendorName") || ""),
      product: String(formData.get("product") || ""),
      quoteAmount: Number(formData.get("quoteAmount") || 0),
      competitorQuote: Number(formData.get("competitorQuote") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/final/procurement");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createDnsChange(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.dnsChanges.create({
      organizationId: String(formData.get("organizationId") || ""),
      domain: String(formData.get("domain") || ""),
      changeType: String(formData.get("changeType") || ""),
      proposedValue: String(formData.get("proposedValue") || ""),
      currentValue: String(formData.get("currentValue") || ""),
      changeDescription: String(formData.get("changeDescription") || ""),
    });
    revalidatePath("/admin/final/dns-changes");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createSatisfaction(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.satisfaction.create({
      organizationId: String(formData.get("organizationId") || ""),
      subject: String(formData.get("subject") || ""),
      question: String(formData.get("question") || ""),
      rating: Number(formData.get("rating") || 0),
      feedback: String(formData.get("feedback") || ""),
    });
    revalidatePath("/admin/final/satisfaction");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createTimeEntry(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.timeEntries.create({
      organizationId: String(formData.get("organizationId") || ""),
      description: String(formData.get("description") || ""),
      hours: Number(formData.get("hours") || 0),
      workDate: String(formData.get("workDate") || ""),
    });
    revalidatePath("/admin/final/time-entries");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createBudget(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.budgets.create({
      organizationId: String(formData.get("organizationId") || ""),
      itemName: String(formData.get("itemName") || ""),
      category: String(formData.get("category") || ""),
      estimatedCost: Number(formData.get("estimatedCost") || 0),
      fiscalYear: Number(formData.get("fiscalYear") || 0),
      priority: String(formData.get("priority") || ""),
    });
    revalidatePath("/admin/final/budgets");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createRunbook(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.runbooks.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      content: String(formData.get("content") || ""),
      category: String(formData.get("category") || ""),
      version: String(formData.get("version") || ""),
    });
    revalidatePath("/admin/final/runbooks");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createForm(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.forms.create({
      organizationId: String(formData.get("organizationId") || ""),
      formName: String(formData.get("formName") || ""),
      formDescription: String(formData.get("formDescription") || ""),
    });
    revalidatePath("/admin/final/forms");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createBackup(formData: FormData) {
  const api = getApiClient();
  try {
    await api.final.backups.create({
      organizationId: String(formData.get("organizationId") || ""),
      systemName: String(formData.get("systemName") || ""),
      backupType: String(formData.get("backupType") || ""),
      retentionDays: Number(formData.get("retentionDays") || 0),
      recoveryPointObjectiveHours: Number(formData.get("recoveryPointObjectiveHours") || 0),
      recoveryTimeObjectiveHours: Number(formData.get("recoveryTimeObjectiveHours") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/final/backups");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Governance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createChangeRequest(formData: FormData) {
  const api = getApiClient();
  try {
    await api.governance.changes.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      changeType: String(formData.get("changeType") || ""),
      riskLevel: String(formData.get("riskLevel") || ""),
      description: String(formData.get("description") || ""),
      rollbackPlan: String(formData.get("rollbackPlan") || ""),
      verificationSteps: String(formData.get("verificationSteps") || ""),
    });
    revalidatePath("/admin/governance/change-requests");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createRisk(formData: FormData) {
  const api = getApiClient();
  try {
    await api.governance.risks.create({
      organizationId: String(formData.get("organizationId") || ""),
      riskDescription: String(formData.get("riskDescription") || ""),
      riskCategory: String(formData.get("riskCategory") || ""),
      likelihood: String(formData.get("likelihood") || ""),
      impact: String(formData.get("impact") || ""),
      mitigatingControls: String(formData.get("mitigatingControls") || ""),
    });
    revalidatePath("/admin/governance/risks");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createRetention(formData: FormData) {
  const api = getApiClient();
  try {
    await api.governance.retention.create({
      organizationId: String(formData.get("organizationId") || ""),
      dataCategory: String(formData.get("dataCategory") || ""),
      systemName: String(formData.get("systemName") || ""),
      retentionPeriodDays: Number(formData.get("retentionPeriodDays") || 0),
      disposalMethod: String(formData.get("disposalMethod") || ""),
      isRegulated: formData.get("isRegulated") === "on",
    });
    revalidatePath("/admin/governance/retention");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Update Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function updateAsset(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.assets.update(id, {
      name: String(formData.get("name") || ""),
      assetType: String(formData.get("assetType") || ""),
      make: String(formData.get("make") || ""),
      model: String(formData.get("model") || ""),
      serialNumber: String(formData.get("serialNumber") || ""),
      assetTag: String(formData.get("assetTag") || ""),
      status: String(formData.get("status") || ""),
      location: String(formData.get("location") || ""),
      purchaseDate: String(formData.get("purchaseDate") || ""),
      warrantyExpires: String(formData.get("warrantyExpires") || ""),
      lifecycleScore: Number(formData.get("lifecycleScore") || 0),
      maintenanceNotes: String(formData.get("maintenanceNotes") || ""),
    } as Record<string, unknown>);
    revalidatePath("/admin/assets");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateBreakGlass(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.breakGlass.update(id, {
      accountName: String(formData.get("accountName") || ""),
      system: String(formData.get("system") || ""),
      custodianName: String(formData.get("custodianName") || ""),
      lastRotatedAt: String(formData.get("lastRotatedAt") || ""),
      nextRotationAt: String(formData.get("nextRotationAt") || ""),
      accessProcedure: String(formData.get("accessProcedure") || ""),
      testNotes: String(formData.get("testNotes") || ""),
      status: String(formData.get("status") || ""),
    });
    revalidatePath("/admin/break-glass");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateDmarc(id: string, formData: FormData) {
  try {
    const baseUrl = getClientEnv().NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/api/v1/batch/dmarc/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: String(formData.get("domain") || ""),
        spf_valid: formData.get("spfValid") === "on",
        dkim_configured: formData.get("dkimConfigured") === "on",
        dmarc_valid: formData.get("dmarcValid") === "on",
        dmarc_policy: String(formData.get("dmarcPolicy") || ""),
        recommendation_notes: String(formData.get("recommendationNotes") || ""),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    revalidatePath("/admin/dmarc");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateDomainMonitor(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.domainMonitors.update(id, {
      domain: String(formData.get("domain") || ""),
      displayName: String(formData.get("displayName") || ""),
      dnsProvider: String(formData.get("dnsProvider") || ""),
      cloudflareProxied: formData.get("cloudflareProxied") === "on",
      checkIntervalHours: Number(formData.get("checkIntervalHours") || 24),
      alertsEnabled: formData.get("alertsEnabled") === "on",
    } as Record<string, unknown>);
    revalidatePath("/admin/domain-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateEndpoint(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.endpoints.update(id, {
      deviceGroup: String(formData.get("deviceGroup") || ""),
      totalEndpoints: Number(formData.get("totalEndpoints") || 0),
      avInstalled: Number(formData.get("avInstalled") || 0),
      diskEncrypted: Number(formData.get("diskEncrypted") || 0),
      mdmEnrolled: Number(formData.get("mdmEnrolled") || 0),
      coveragePct: Number(formData.get("coveragePct") || 0),
    });
    revalidatePath("/admin/endpoint-security");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateFileRequest(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await (api.fileRequests as any).update(id, {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      token: String(formData.get("token") || ""),
      expiresAt: String(formData.get("expiresAt") || ""),
      maxFileSizeMb: Number(formData.get("maxFileSizeMb") || 0),
      maxFiles: Number(formData.get("maxFiles") || 0),
      status: String(formData.get("status") || ""),
    });
    revalidatePath("/admin/file-requests");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateFinding(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.findings.update(id, {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      severity: String(formData.get("severity") || ""),
      status: String(formData.get("status") || ""),
      source: String(formData.get("source") || ""),
      remediationPlan: String(formData.get("remediationPlan") || ""),
      remediationDeadline: String(formData.get("remediationDeadline") || ""),
      findingCategory: String(formData.get("findingCategory") || ""),
      affectedSystems: String(formData.get("affectedSystems") || ""),
    });
    revalidatePath("/admin/findings");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateIdVerify(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.idVerify.update(id, {
      requestorName: String(formData.get("requestorName") || ""),
      verificationMethod: String(formData.get("verificationMethod") || ""),
      actionAuthorized: String(formData.get("actionAuthorized") || ""),
      verificationPass: formData.get("verificationPass") === "on",
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/id-verify");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateIncident(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.incidents.update(id, {
      title: String(formData.get("title") || ""),
      incidentType: String(formData.get("incidentType") || ""),
      severity: String(formData.get("severity") || ""),
      status: String(formData.get("status") || ""),
      description: String(formData.get("description") || ""),
      affectedSystems: String(formData.get("affectedSystems") || ""),
      rootCause: String(formData.get("rootCause") || ""),
      lessonsLearned: String(formData.get("lessonsLearned") || ""),
    });
    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateLicense(id: string, formData: FormData) {
  try {
    const baseUrl = getClientEnv().NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/api/v1/batch/licenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor: String(formData.get("vendor") || ""),
        product_name: String(formData.get("productName") || ""),
        total_seats: Number(formData.get("totalSeats") || 0),
        assigned_seats: Number(formData.get("assignedSeats") || 0),
        unused_seats: Number(formData.get("unusedSeats") || 0),
        cost_per_seat: Number(formData.get("costPerSeat") || 0),
        annual_cost: Number(formData.get("annualCost") || 0),
        renewal_date: String(formData.get("renewalDate") || ""),
        optimization_notes: String(formData.get("optimizationNotes") || ""),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    revalidatePath("/admin/licenses");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateM365(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securitySuite.m365.update(id, {
      tenantDomain: String(formData.get("tenantDomain") || ""),
      mfaEnforced: formData.get("mfaEnforced") === "on",
      conditionalAccessConfigured: formData.get("conditionalAccessConfigured") === "on",
      legacyAuthBlocked: formData.get("legacyAuthBlocked") === "on",
      overallScore: Number(formData.get("overallScore") || 0),
      notes: String(formData.get("notes") || ""),
    });
    revalidatePath("/admin/m365-hardening");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateOffboarding(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.offboarding.update(id, {
      employeeName: String(formData.get("employeeName") || ""),
      employeeEmail: String(formData.get("employeeEmail") || ""),
      department: String(formData.get("department") || ""),
      offboardingDate: String(formData.get("offboardingDate") || ""),
      accountDisabled: formData.get("accountDisabled") === "on",
      mailboxConverted: formData.get("mailboxConverted") === "on",
      onedriveTransferred: formData.get("onedriveTransferred") === "on",
      licenseReclaimed: formData.get("licenseReclaimed") === "on",
      accessReviewed: formData.get("accessReviewed") === "on",
      evidenceCollected: formData.get("evidenceCollected") === "on",
    });
    revalidatePath("/admin/offboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateOnboarding(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.clientOnboarding.update(id, {
      clientName: String(formData.get("clientName") || ""),
      clientDomain: String(formData.get("clientDomain") || "") || null,
      clientContactEmail: String(formData.get("clientContactEmail") || "") || null,
      clientContactPhone: String(formData.get("clientContactPhone") || "") || null,
      status: String(formData.get("status") || "discovery"),
      phase: String(formData.get("phase") || "discovery"),
      riskLevel: String(formData.get("riskLevel") || "medium"),
      m365SetupStatus: String(formData.get("m365SetupStatus") || "not_started"),
      m365TenantId: String(formData.get("m365TenantId") || "") || null,
      accessCollectionStatus: String(formData.get("accessCollectionStatus") || "not_started"),
      networkBaselineStatus: String(formData.get("networkBaselineStatus") || "not_started"),
      documentationStatus: String(formData.get("documentationStatus") || "not_started"),
      securityBaselineStatus: String(formData.get("securityBaselineStatus") || "not_started"),
      securityBaselineScore:
        formData.get("securityBaselineScore") !== null &&
        String(formData.get("securityBaselineScore") || "") !== ""
          ? Number(formData.get("securityBaselineScore"))
          : null,
      supportHandoffStatus: String(formData.get("supportHandoffStatus") || "not_started"),
      supportHandoffNotes: String(formData.get("supportHandoffNotes") || "") || null,
      discoveryNotes: String(formData.get("discoveryNotes") || "") || null,
    });
    revalidatePath("/admin/onboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteOnboarding(id: string) {
  const api = getApiClient();
  try {
    await api.clientOnboarding.remove(id);
    revalidatePath("/admin/onboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteAsset(id: string) {
  const api = getApiClient();
  try {
    await api.assets.remove(id);
    revalidatePath("/admin/assets");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteM365Hardening(id: string) {
  const api = getApiClient();
  try {
    await api.securitySuite.m365.remove(id);
    revalidatePath("/admin/m365-hardening");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteIncident(id: string) {
  const api = getApiClient();
  try {
    await api.securitySuite.incidents.remove(id);
    revalidatePath("/admin/incidents");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteIdVerify(id: string) {
  const api = getApiClient();
  try {
    await api.securitySuite.idVerify.remove(id);
    revalidatePath("/admin/id-verify");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteEndpoint(id: string) {
  const api = getApiClient();
  try {
    await api.securitySuite.endpoints.remove(id);
    revalidatePath("/admin/endpoint-security");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteService(id: string) {
  const api = getApiClient();
  try {
    await api.serviceCatalog.remove(id);
    revalidatePath("/admin/service-catalog");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteBreakGlass(id: string) {
  const api = getApiClient();
  try {
    await api.securityOps.breakGlass.remove(id);
    revalidatePath("/admin/break-glass");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteOffboarding(id: string) {
  const api = getApiClient();
  try {
    await api.securityOps.offboarding.remove(id);
    revalidatePath("/admin/offboarding");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deletePatchGroup(id: string) {
  const api = getApiClient();
  try {
    await api.securityOps.patchCompliance.remove(id);
    revalidatePath("/admin/patch-compliance");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteFileRequest(id: string) {
  const api = getApiClient();
  try {
    await api.fileRequests.remove(id);
    revalidatePath("/admin/file-requests");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteDomainMonitor(id: string) {
  const api = getApiClient();
  try {
    await api.domainMonitors.remove(id);
    revalidatePath("/admin/domain-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteFinding(id: string) {
  const api = getApiClient();
  try {
    await api.findings.remove(id);
    revalidatePath("/admin/findings");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteLicense(id: string) {
  const api = getApiClient();
  try {
    await api.batch.licenses.remove(id);
    revalidatePath("/admin/licenses");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteDmarc(id: string) {
  const api = getApiClient();
  try {
    await api.batch.dmarc.remove(id);
    revalidatePath("/admin/dmarc");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteVendorContract(id: string) {
  const api = getApiClient();
  try {
    await api.vendors.contracts.remove(id);
    revalidatePath("/admin/vendor-contracts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteVendorContact(id: string) {
  const api = getApiClient();
  try {
    await api.vendors.contacts.remove(id);
    revalidatePath("/admin/vendor-contacts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteStatusItem(id: string) {
  const api = getApiClient();
  try {
    await api.batch.status.remove(id);
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteWebsiteMonitor(id: string) {
  const api = getApiClient();
  try {
    await api.batch.websiteMonitors.remove(id);
    revalidatePath("/admin/website-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updatePatchGroup(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.securityOps.patchCompliance.update(id, {
      deviceGroup: String(formData.get("deviceGroup") || ""),
      totalDevices: Number(formData.get("totalDevices") || 0),
      patchedDevices: Number(formData.get("patchedDevices") || 0),
      pendingPatches: Number(formData.get("pendingPatches") || 0),
      criticalPatches: Number(formData.get("criticalPatches") || 0),
      compliancePct: Number(formData.get("compliancePct") || 0),
    });
    revalidatePath("/admin/patch-compliance");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateService(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.serviceCatalog.update(id, {
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || ""),
      basePrice: Number(formData.get("basePrice") || 0),
      unit: String(formData.get("unit") || ""),
      billingModel: String(formData.get("billingModel") || ""),
      isBundled: formData.get("isBundled") === "on",
      isActive: formData.get("isActive") === "on",
    } as Record<string, unknown>);
    revalidatePath("/admin/service-catalog");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateStatusItem(id: string, formData: FormData) {
  try {
    const baseUrl = getClientEnv().NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/api/v1/batch/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title") || ""),
        severity: String(formData.get("severity") || ""),
        description: String(formData.get("description") || ""),
        is_public: formData.get("isPublic") === "on",
        is_resolved: formData.get("isResolved") === "on",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    revalidatePath("/admin/status");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateVendorContract(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.vendors.contracts.update(id, {
      vendorName: String(formData.get("vendorName") || ""),
      serviceName: String(formData.get("serviceName") || ""),
      contractNumber: String(formData.get("contractNumber") || ""),
      renewalDate: String(formData.get("renewalDate") || ""),
      endDate: String(formData.get("endDate") || ""),
      contractValue: Number(formData.get("contractValue") || 0),
      autoRenews: formData.get("autoRenews") === "on",
      notes: String(formData.get("notes") || ""),
    } as Record<string, unknown>);
    revalidatePath("/admin/vendor-contracts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateVendorContact(id: string, formData: FormData) {
  const api = getApiClient();
  try {
    await api.vendors.contacts.update(id, {
      vendorName: String(formData.get("vendorName") || ""),
      contactName: String(formData.get("contactName") || ""),
      roleTitle: String(formData.get("roleTitle") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      supportPortalUrl: String(formData.get("supportPortalUrl") || ""),
      accountNumber: String(formData.get("accountNumber") || ""),
      isPrimary: formData.get("isPrimary") === "on",
      notes: String(formData.get("notes") || ""),
    } as Record<string, unknown>);
    revalidatePath("/admin/vendor-contacts");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateWebsiteMonitor(id: string, formData: FormData) {
  try {
    const baseUrl = getClientEnv().NEXT_PUBLIC_API_URL;
    const res = await fetch(`${baseUrl}/api/v1/batch/website-monitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: String(formData.get("url") || ""),
        display_name: String(formData.get("displayName") || ""),
        check_interval_hours: Number(formData.get("checkIntervalHours") || 24),
        alerts_enabled: formData.get("alertsEnabled") === "on",
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    revalidatePath("/admin/website-monitors");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// â”€â”€ Governance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function createTabletop(formData: FormData) {
  const api = getApiClient();
  try {
    await api.governance.tabletop.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      scenario: String(formData.get("scenario") || ""),
      scenarioType: String(formData.get("scenarioType") || ""),
      participants: String(formData.get("participants") || ""),
      scheduledDate: String(formData.get("scheduledDate") || ""),
      notes: String(formData.get("notes") || ""),
      actionItems: String(formData.get("actionItems") || ""),
      afterActionReport: String(formData.get("afterActionReport") || ""),
    });
    revalidatePath("/admin/governance/tabletop");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createInsuranceEvidence(formData: FormData) {
  const api = getApiClient();
  try {
    await api.insuranceBinder.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      evidenceType: String(formData.get("evidenceType") || "document"),
      coverageArea: String(formData.get("coverageArea") || "") || null,
    });
    revalidatePath("/admin/insurance-binder");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createLicenseAllocation(formData: FormData) {
  const api = getApiClient();
  try {
    await api.licenseOptimizer.create({
      organizationId: String(formData.get("organizationId") || ""),
      softwareName: String(formData.get("softwareName") || ""),
      licenseType: String(formData.get("licenseType") || "per_seat"),
      totalSeats: Number(formData.get("totalSeats") || 0),
      usedSeats: Number(formData.get("usedSeats") || 0),
      costPerSeat: Number(formData.get("costPerSeat") || 0),
    });
    revalidatePath("/admin/license-optimizer");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createStatusComponent(formData: FormData) {
  const api = getApiClient();
  try {
    await api.statusPage.components.create({
      organizationId: String(formData.get("organizationId") || ""),
      name: String(formData.get("name") || ""),
      description: String(formData.get("description") || ""),
      componentType: String(formData.get("componentType") || "application"),
      status: String(formData.get("status") || "operational"),
    });
    revalidatePath("/admin/status-pages");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createUptimeCheck(formData: FormData) {
  const api = getApiClient();
  try {
    await api.uptimeMonitor.createCheck({
      organizationId: String(formData.get("organizationId") || ""),
      url: String(formData.get("url") || ""),
      checkType: String(formData.get("checkType") || "http"),
      checkIntervalMinutes: Number(formData.get("checkIntervalMinutes") || 5),
      expectedStatusCode: Number(formData.get("expectedStatusCode") || 200),
      timeoutSeconds: Number(formData.get("timeoutSeconds") || 10),
      status: String(formData.get("status") || "active"),
    });
    revalidatePath("/admin/uptime-monitor");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createTrainingCourse(formData: FormData) {
  const api = getApiClient();
  try {
    await api.trainingHub.courses.create({
      organizationId: String(formData.get("organizationId") || ""),
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || null,
      category: String(formData.get("category") || "general"),
      difficulty: String(formData.get("difficulty") || "beginner"),
      estimatedMinutes: Number(formData.get("estimatedMinutes") || 30),
      status: String(formData.get("status") || "draft"),
    });
    revalidatePath("/admin/training-hub");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
