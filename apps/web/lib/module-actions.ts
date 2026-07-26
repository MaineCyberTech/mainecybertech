"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

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
    await api.securityOps.onboarding.create({
      organizationId: String(formData.get("organizationId") || ""),
      clientName: String(formData.get("clientName") || ""),
      notes: String(formData.get("notes") || ""),
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

// ── Field Services ──────────────────────────────────────────────

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

// ── Edu-Automation ──────────────────────────────────────────────

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

// ── Final (More Tools) ──────────────────────────────────────────

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

// ── Governance ──────────────────────────────────────────────────

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
