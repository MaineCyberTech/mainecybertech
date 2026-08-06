import { jest } from "@jest/globals";
import { MCTClient } from "../index";

const BASE_URL = "https://api.test.com";

let mockFetch: jest.Mock<typeof fetch>;
let client: MCTClient;

function mockResponse<T>(data: T, ok = true, status = 200): Promise<Response> {
  const body = ok
    ? { success: true, data }
    : { success: false, error: { code: "ERROR", message: "Test error", status } };
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? "OK" : "Error",
    type: "basic" as ResponseType,
    url: "",
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
  } as Response);
}

function paginated<T>(items: T[] = []) {
  return { items, total: items.length, page: 1, limit: 25 };
}

describe("SDK modules — expanded coverage", () => {
  beforeEach(() => {
    mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    client = MCTClient.create({ baseUrl: BASE_URL });
  });

  describe("GovernanceApi", () => {
    it("lists change-requests", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1", title: "CR-1" }])));
      const result = await client.governance.changes.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/governance/change-requests");
    });
    it("gets a single change-request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", title: "CR-1" }));
      const result = await client.governance.changes.get("1");
      expect(result.id).toBe("1");
    });
    it("creates a change-request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.governance.changes.create({ title: "New CR" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("updates a change-request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.governance.changes.update("1", { title: "Updated" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });
    it("deletes a change-request", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.governance.changes.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
    it("lists risks", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.governance.risks.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a risk", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.governance.risks.get("1");
      expect(result.id).toBe("1");
    });
    it("lists retention policies", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.governance.retention.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a retention policy", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.governance.retention.get("1");
      expect(result.id).toBe("1");
    });
    it("lists tabletop exercises", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.governance.tabletop.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a tabletop exercise", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.governance.tabletop.get("1");
      expect(result.id).toBe("1");
    });
    it("approves a change-request via workflow endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "approved" }));
      await client.governance.changes.approve("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[0][0]).toContain("/change-requests/1/approve");
    });
    it("submits a change-request via workflow endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "pending_review" }));
      await client.governance.changes.submit("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/change-requests/1/submit");
    });
    it("assesses a risk via workflow endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", risk_score: 25 }));
      await client.governance.risks.assess("1", { likelihood: 5, impact: 5 });
      expect(mockFetch.mock.calls[0][0]).toContain("/risks/1/assess");
    });
  });

  describe("BatchApi", () => {
    it("lists licenses", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.batch.licenses.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a single license", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", vendor: "Microsoft" }));
      const result = await client.batch.licenses.get("1");
      expect(result.id).toBe("1");
    });
    it("creates a license", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.batch.licenses.create({ vendor: "Microsoft" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("updates a license", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.batch.licenses.update("1", { vendor: "Updated" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });
    it("deletes a license", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.batch.licenses.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
    it("gets license savings", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          totalLicenses: 10,
          totalAnnualCost: 5000,
          reclaimableSavings: 1000,
          unusedSeats: 5,
        }),
      );
      const result = await client.batch.licenses.savings({ organization_id: "org-1" });
      expect(result.totalLicenses).toBe(10);
    });
    it("lists status items", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.batch.status.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a status item", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.batch.status.get("1");
      expect(result.id).toBe("1");
    });
    it("gets public status", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "1", is_public: true }]));
      const result = await client.batch.status.public();
      expect(result).toHaveLength(1);
    });
    it("lists website monitors", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.batch.websiteMonitors.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a website monitor", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.batch.websiteMonitors.get("1");
      expect(result.id).toBe("1");
    });
    it("lists DMARC assessments", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.batch.dmarc.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a DMARC assessment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.batch.dmarc.get("1");
      expect(result.id).toBe("1");
    });
  });

  describe("SecuritySuiteApi", () => {
    it("lists M365 hardening records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securitySuite.m365.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets M365 record", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securitySuite.m365.get("1");
      expect(result.id).toBe("1");
    });
    it("lists incidents", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securitySuite.incidents.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an incident", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securitySuite.incidents.get("1");
      expect(result.id).toBe("1");
    });
    it("lists identity verifications", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securitySuite.idVerify.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an identity verification", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securitySuite.idVerify.get("1");
      expect(result.id).toBe("1");
    });
    it("lists endpoint security records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securitySuite.endpoints.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an endpoint security record", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securitySuite.endpoints.get("1");
      expect(result.id).toBe("1");
    });
    it("deletes an M365 record", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.securitySuite.m365.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("SecurityOpsApi", () => {
    it("lists offboarding records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securityOps.offboarding.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an offboarding record", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securityOps.offboarding.get("1");
      expect(result.id).toBe("1");
    });
    it("lists break-glass accounts", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securityOps.breakGlass.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a break-glass account", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securityOps.breakGlass.get("1");
      expect(result.id).toBe("1");
    });
    it("lists onboarding clients", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securityOps.onboarding.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an onboarding client", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securityOps.onboarding.get("1");
      expect(result.id).toBe("1");
    });
    it("lists patch compliance groups", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.securityOps.patchCompliance.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a patch compliance group", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.securityOps.patchCompliance.get("1");
      expect(result.id).toBe("1");
    });
    it("gets patch compliance stats", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          totalDevices: 100,
          patchedDevices: 90,
          criticalPatches: 3,
          complianceRate: 90,
        }),
      );
      const result = await client.securityOps.patchCompliance.stats({ organization_id: "org-1" });
      expect(result.complianceRate).toBe(90);
    });
    it("deletes an offboarding record", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.securityOps.offboarding.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("FieldServicesApi", () => {
    it("lists ISP assessments", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.isp.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an ISP assessment", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.fieldServices.isp.get("1");
      expect(result.id).toBe("1");
    });
    it("lists port maps", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.portMaps.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a port map", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.fieldServices.portMaps.get("1");
      expect(result.id).toBe("1");
    });
    it("lists network diagrams", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.networkDiagrams.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a network diagram", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.fieldServices.networkDiagrams.get("1");
      expect(result.id).toBe("1");
    });
    it("deletes an ISP assessment", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.fieldServices.isp.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
    it("lists unifi records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.unifi.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists camera calc records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.camera.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists staging records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fieldServices.staging.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("calls camera calculate", async () => {
      mockFetch.mockResolvedValue(mockResponse({ totalStorageTB: 1.13 }));
      const result = await client.fieldServices.camera.calculate({
        organizationId: "org-1",
        cameraCount: 8,
        bitrateMbps: 4,
        retentionDays: 30,
      });
      expect(result.totalStorageTB).toBe(1.13);
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[0][0]).toContain("/field-services/camera-calc/calculate");
    });
  });

  describe("EduAutomationApi", () => {
    it("lists SOPs", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.sop.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a SOP", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.eduAutomation.sop.get("1");
      expect(result.id).toBe("1");
    });
    it("creates a SOP", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.eduAutomation.sop.create({ title: "New SOP" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("updates a SOP", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.eduAutomation.sop.update("1", { title: "Updated" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("PATCH");
    });
    it("deletes a SOP", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.eduAutomation.sop.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
    it("lists compliance records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.compliance.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists insurance records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.insurance.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists AI policy records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.aiPolicy.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists training records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.training.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists phishing records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.phishing.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists automation records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.automation.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists kbGenerator records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.eduAutomation.kbGenerator.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("launches a phishing campaign via workflow endpoint", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "active" }));
      await client.eduAutomation.phishing.launch("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/phishing/1/launch");
    });
    it("executes an automation workflow", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "running" }));
      await client.eduAutomation.automation.execute("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/automation/1/execute");
    });
    it("checks a powershell script via policy guard", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", risk_level: "low" }));
      await client.eduAutomation.powershell.check("1");
      expect(mockFetch.mock.calls[0][0]).toContain("/powershell/1/check");
    });
    it("evaluates scorecards", async () => {
      mockFetch.mockResolvedValue(mockResponse({ evaluated: 2 }));
      await client.eduAutomation.scorecards.evaluate({ organizationId: "org-1" });
      expect(mockFetch.mock.calls[0][0]).toContain("/scorecards/evaluate");
    });
  });

  describe("FinalApi", () => {
    it("lists sharepoint plans", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.final.sharepoint.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a sharepoint plan", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.final.sharepoint.get("1");
      expect(result.id).toBe("1");
    });
    it("gets sharepoint structure summary", async () => {
      mockFetch.mockResolvedValue(mockResponse({ totalPlans: 3, activeSites: 2 }));
      const result = await client.final.sharepoint.structureSummary({ organization_id: "org-1" });
      expect(result.totalPlans).toBe(3);
      expect(mockFetch.mock.calls[0][0]).toContain("/sharepoint/structure-summary");
    });
    it("lists time entries", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.final.timeEntries.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a time entry", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.final.timeEntries.get("1");
      expect(result.id).toBe("1");
    });
    it("lists device profiles", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.final.deviceProfiles.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists SaaS audit records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.final.saasAudit.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists procurement records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.final.procurement.list({ organization_id: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("compares procurement quotes", async () => {
      mockFetch.mockResolvedValue(mockResponse({ lowestPrice: 900 }));
      const result = await client.final.procurement.compare(["q1", "q2"]);
      expect(result.lowestPrice).toBe(900);
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[0][0]).toContain("/final/procurement/compare");
    });
    it("gets backup stats", async () => {
      mockFetch.mockResolvedValue(mockResponse({ total: 10, failed: 1 }));
      const result = await client.final.backups.stats({ organization_id: "org-1" });
      expect(result.total).toBe(10);
      expect(result.failed).toBe(1);
    });
    it("deletes a backup", async () => {
      mockFetch.mockResolvedValue(mockResponse(null, true, 204));
      await client.final.backups.remove("1");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("DELETE");
    });
  });

  describe("BusinessOsApi", () => {
    it("gets dashboard summary", async () => {
      mockFetch.mockResolvedValue(mockResponse({ totalOrgs: 5 }));
      const result = await client.businessOs.summary();
      expect(result.totalOrgs).toBe(5);
      expect(mockFetch.mock.calls[0][0]).toContain("/business-os/summary");
    });
    it("gets approvals overdue", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      const result = await client.businessOs.approvalsOverdue();
      expect(result).toHaveLength(0);
    });
    it("gets recent activity", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      const result = await client.businessOs.recentActivity();
      expect(result).toHaveLength(0);
    });
    it("gets org health", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      const result = await client.businessOs.orgHealth();
      expect(result).toHaveLength(0);
    });
  });

  describe("AiApi", () => {
    it("calls triageAnalyze", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ id: "t-1", suggested_priority: "high", status: "analyzed" }),
      );
      const result = await client.ai.triageAnalyze({
        organizationId: "org-1",
        rawDescription: "Server is down",
      });
      expect(result.id).toBe("t-1");
      expect(result.suggested_priority).toBe("high");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("calls triageList", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "t-1", status: "analyzed" }])));
      const result = await client.ai.triageList({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("calls copilotSummarize", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          ticketId: "t-1",
          subject: "Test",
          status: "open",
          priority: "high",
          category: "support",
          commentCount: 3,
          keyPoints: ["a"],
          suggestedNextAction: "reply",
        }),
      );
      const result = await client.ai.copilotSummarize("t-1");
      expect(result.ticketId).toBe("t-1");
    });
  });

  describe("ApprovalsApi", () => {
    it("lists approvals", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.approvals.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an approval", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", comments: [], timeline: [] }));
      const result = await client.approvals.get("1");
      expect(result.id).toBe("1");
    });
    it("gets stats", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ total: 10, pending: 3, approved: 5, rejected: 1, cancelled: 1 }),
      );
      const result = await client.approvals.stats({ organizationId: "org-1" });
      expect(result.pending).toBe(3);
    });
    it("creates an approval", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "pending" }));
      await client.approvals.create({
        organizationId: "org-1",
        requestType: "general",
        requestSubject: "Need access",
      });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("approves a request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", status: "approved" }));
      await client.approvals.approve("1", { organizationId: "org-1" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/approvals/1/approve");
    });
  });

  describe("AssetsApi", () => {
    it("lists assets", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.assets.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets an asset", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", comments: [], timeline: [] }));
      const result = await client.assets.get("1");
      expect(result.id).toBe("1");
    });
    it("gets asset stats", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ total: 50, byStatus: {}, byType: {}, expiringWarranty: 3 }),
      );
      const result = await client.assets.stats({ organizationId: "org-1" });
      expect(result.total).toBe(50);
    });
    it("creates an asset", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.assets.create({ name: "Laptop" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
  });

  describe("FileRequestsApi", () => {
    it("lists file requests", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.fileRequests.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a file request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.fileRequests.get("1");
      expect(result.id).toBe("1");
    });
    it("creates a file request", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.fileRequests.create({ organizationId: "org-1", title: "Upload docs" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
  });

  describe("SLApi", () => {
    it("gets SLA metrics", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          summary: { total: 100, breached: 5, breachedRate: 5, resolved: 90 },
          byMetric: {},
          recent: [],
        }),
      );
      const result = await client.sla.metrics({ organizationId: "org-1" });
      expect(result.summary.total).toBe(100);
      expect(result.summary.breached).toBe(5);
    });
  });

  describe("VendorsApi", () => {
    it("lists vendor contracts", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.vendors.contracts.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a vendor contract", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.vendors.contracts.get("1");
      expect(result.id).toBe("1");
    });
    it("creates a vendor contract", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      await client.vendors.contracts.create({ vendor_name: "ACME" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("lists vendor contacts", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.vendors.contacts.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a vendor contact", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.vendors.contacts.get("1");
      expect(result.id).toBe("1");
    });
    it("gets vendor renewals", async () => {
      mockFetch.mockResolvedValue(mockResponse({ items: [{ id: "1" }], total: 1 }));
      const result = await client.vendors.contracts.renewals({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("DomainMonitorsApi", () => {
    it("lists domain monitors", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.domainMonitors.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a domain monitor", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1" }));
      const result = await client.domainMonitors.get("1");
      expect(result.id).toBe("1");
    });
    it("gets domain stats", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          total: 5,
          sslInvalid: 1,
          sslExpiring: 0,
          spfMissing: 0,
          dkimMissing: 0,
          dmarcMissing: 0,
          nsMismatch: 0,
          notProxied: 1,
        }),
      );
      const result = await client.domainMonitors.stats({ organizationId: "org-1" });
      expect(result.total).toBe(5);
    });
  });

  describe("ProposalsApi", () => {
    it("lists proposals", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.proposals.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a proposal", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ id: "1", phases: [], items: [], comments: [], timeline: [] }),
      );
      const result = await client.proposals.get("1");
      expect(result.id).toBe("1");
    });
  });

  describe("FindingsApi", () => {
    it("lists findings", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.findings.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a finding", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "1", comments: [], timeline: [] }));
      const result = await client.findings.get("1");
      expect(result.id).toBe("1");
    });
    it("gets finding stats", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ total: 10, bySeverity: { p0: 1, p1: 2, p2: 4, p3: 3 }, byStatus: {} }),
      );
      const result = await client.findings.stats({ organizationId: "org-1" });
      expect(result.total).toBe(10);
      expect(result.bySeverity.p0).toBe(1);
    });
  });

  describe("QbrApi", () => {
    it("lists QBR reports", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.qbr.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("ServiceCatalogApi", () => {
    it("lists service catalog items", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.serviceCatalog.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("ClientOnboardingApi", () => {
    it("lists onboarding records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.clientOnboarding.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("SatisfactionPulseApi", () => {
    it("lists satisfaction pulse records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.satisfactionPulse.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("DynamicFormsApi", () => {
    it("lists dynamic form records", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "1" }])));
      const result = await client.dynamicForms.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("SearchApi", () => {
    it("performs admin search", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ projects: [], tickets: [], users: [], organizations: [] }),
      );
      const result = await client.search.admin("test");
      expect(result.projects).toHaveLength(0);
    });
    it("performs portal search", async () => {
      mockFetch.mockResolvedValue(mockResponse({ projects: [], tickets: [], documents: [] }));
      const result = await client.search.portal("test", "org-1");
      expect(result.projects).toHaveLength(0);
    });
  });

  describe("StatusPageApi", () => {
    it("gets public status", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({ components: [], activeIncidents: [], upcomingMaintenance: [] }),
      );
      const result = await client.statusPage.publicStatus("org-1");
      expect(result.components).toHaveLength(0);
    });
    it("lists components", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "c1", name: "API" }])));
      const result = await client.statusPage.components.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("creates a component", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1" }));
      await client.statusPage.components.create({ organizationId: "org-1", name: "API" });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("lists incidents", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "i1" }])));
      const result = await client.statusPage.incidents.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("lists maintenance notices", async () => {
      mockFetch.mockResolvedValue(mockResponse(paginated([{ id: "m1" }])));
      const result = await client.statusPage.maintenance.list({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
  });

  describe("UptimeMonitorApi", () => {
    it("lists checks", async () => {
      mockFetch.mockResolvedValue(
        mockResponse(paginated([{ id: "c1", url: "https://example.com" }])),
      );
      const result = await client.uptimeMonitor.listChecks({ organizationId: "org-1" });
      expect(result.items).toHaveLength(1);
    });
    it("gets a check", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1" }));
      const result = await client.uptimeMonitor.getCheck("c1");
      expect(result.id).toBe("c1");
    });
    it("creates a check", async () => {
      mockFetch.mockResolvedValue(mockResponse({ id: "c1" }));
      await client.uptimeMonitor.createCheck({
        organizationId: "org-1",
        url: "https://example.com",
      });
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
    });
    it("gets results", async () => {
      mockFetch.mockResolvedValue(mockResponse([{ id: "r1", is_up: true }]));
      const result = await client.uptimeMonitor.getResults("c1");
      expect(result).toHaveLength(1);
    });
    it("gets uptime stats", async () => {
      mockFetch.mockResolvedValue(mockResponse({ "7d": { total: 100, up: 99, pct: 99 } }));
      const result = await client.uptimeMonitor.getUptime("c1");
      expect(result["7d"]).toBeDefined();
    });
    it("gets dashboard", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          checks: [],
          summary: { total: 0, up: 0, down: 0, paused: 0, overallUptime: 100 },
        }),
      );
      const result = await client.uptimeMonitor.dashboard();
      expect(result.summary).toBeDefined();
    });
  });

  describe("BillingApi", () => {
    const subscription = {
      id: "sub1",
      organization_id: "o1",
      plan_name: "Premium",
      status: "active",
      amount_cents: 249900,
      currency: "usd",
      created_at: "",
    };

    it("listSubscriptions fetches subscriptions", async () => {
      mockFetch.mockResolvedValue(mockResponse([subscription]));
      const result = await client.billing.listSubscriptions({ organizationId: "o1" });
      expect(result).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/billing/subscriptions");
    });

    it("summary fetches billing summary with org param", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          activeSubscriptions: 1,
          overdueInvoices: 0,
          paidInvoices: 5,
          totalInvoices: 10,
          recentInvoices: [],
        }),
      );
      const result = await client.billing.summary({ organizationId: "o1" });
      expect(result.activeSubscriptions).toBe(1);
      expect(mockFetch.mock.calls[0][0]).toContain("organization_id=o1");
    });

    it("createPortalSession posts and returns a URL", async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: "https://billing.stripe.com/session" }));
      const result = await client.billing.createPortalSession({ organizationId: "o1" });
      expect(result.url).toBe("https://billing.stripe.com/session");
      expect(mockFetch.mock.calls[0][1]?.method).toBe("POST");
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/billing/create-portal-session");
    });

    it("createPortalSession works without params", async () => {
      mockFetch.mockResolvedValue(mockResponse({ url: "https://billing.stripe.com/session" }));
      const result = await client.billing.createPortalSession();
      expect(result.url).toBeDefined();
    });

    it("listSubscriptions returns empty array", async () => {
      mockFetch.mockResolvedValue(mockResponse([]));
      const result = await client.billing.listSubscriptions();
      expect(result).toEqual([]);
    });

    it("listPayments fetches paginated payments", async () => {
      mockFetch.mockResolvedValue(
        mockResponse(
          paginated([
            { id: "p1", amount_cents: 5000, currency: "usd", status: "succeeded", created_at: "" },
          ]),
        ),
      );
      const result = await client.billing.listPayments({
        organizationId: "o1",
        page: 1,
        limit: 10,
      });
      expect(result.items).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/billing/payments");
    });

    it("getBillingCustomer fetches customer info", async () => {
      mockFetch.mockResolvedValue(
        mockResponse({
          id: "bc1",
          organization_id: "o1",
          billing_email: "billing@test.com",
          created_at: "",
        }),
      );
      const result = await client.billing.getBillingCustomer({ organizationId: "o1" });
      expect(result.billing_email).toBe("billing@test.com");
    });

    it("getBillingCustomer returns null when no customer", async () => {
      mockFetch.mockResolvedValue(mockResponse(null));
      const result = await client.billing.getBillingCustomer();
      expect(result).toBeNull();
    });
  });
});
