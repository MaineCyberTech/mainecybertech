import {
  getAnalyticsEventNames,
  getAnalyticsEventShape,
  getPrivacyRules,
  getLeadScoringData,
  getRecEngineV2Data,
  getComparisonData,
  getComparisonBySlug,
  getPackageLadders,
  getPackageLadderForCategory,
  getProposalData,
  getIntakeToProjectData,
  getLifecycleStates,
  getContentQualityAuditorData,
  getSEOLandingPages,
  getFAQData,
  getFAQsForProduct,
  getTestimonials,
  getApprovedTestimonials,
  getCaseStudies,
  getApprovedCaseStudies,
  getCaseStudyBySlug,
  getEmailNurtureData,
  getPortalServiceHubData,
  getFulfillmentChecklists,
  getChecklistForProduct,
  getProfitabilityData,
  getDependencyEngineData,
  getDependenciesForProduct,
  getLeadMagnets,
  getLeadMagnetBySlug,
} from "@/lib/catalog/v5-loaders";

describe("V5 Loaders — Comprehensive Coverage", () => {
  // ==================== Analytics ====================
  describe("getAnalyticsEventNames", () => {
    it("returns array of strings", () => {
      const names = getAnalyticsEventNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      names.forEach((n) => expect(typeof n).toBe("string"));
    });
  });

  describe("getAnalyticsEventShape", () => {
    it("returns record of field-to-type mappings", () => {
      const shape = getAnalyticsEventShape();
      expect(typeof shape).toBe("object");
      expect(Object.keys(shape).length).toBeGreaterThan(0);
    });
  });

  describe("getPrivacyRules", () => {
    it("returns array of rules", () => {
      const rules = getPrivacyRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });
  });

  // ==================== Lead Scoring ====================
  describe("getLeadScoringData", () => {
    it("has rules and scoreBands", () => {
      const data = getLeadScoringData();
      expect(data).toHaveProperty("rules");
      expect(data).toHaveProperty("scoreBands");
      expect(Array.isArray(data.rules)).toBe(true);
      expect(data.rules.length).toBeGreaterThan(0);
      expect(Array.isArray(data.scoreBands)).toBe(true);
      expect(data.scoreBands.length).toBeGreaterThan(0);
    });

    it("each score band has id, min, max", () => {
      const data = getLeadScoringData();
      for (const band of data.scoreBands) {
        expect(band).toHaveProperty("id");
        expect(typeof band.min).toBe("number");
        expect(typeof band.max).toBe("number");
        expect(band.min).toBeLessThanOrEqual(band.max);
      }
    });

    it("has statuses and adminFields", () => {
      const data = getLeadScoringData();
      expect(Array.isArray(data.statuses)).toBe(true);
      expect(data.statuses.length).toBeGreaterThan(0);
      expect(Array.isArray(data.adminFields)).toBe(true);
      expect(data.adminFields.length).toBeGreaterThan(0);
    });
  });

  // ==================== Rec Engine V2 ====================
  describe("getRecEngineV2Data", () => {
    it("has recommendationTypes array", () => {
      const data = getRecEngineV2Data();
      expect(data).toHaveProperty("recommendationTypes");
      expect(Array.isArray(data.recommendationTypes)).toBe(true);
      expect(data.recommendationTypes.length).toBeGreaterThan(0);
    });

    it("has examples array with sourceProduct and recommend", () => {
      const data = getRecEngineV2Data();
      expect(Array.isArray(data.examples)).toBe(true);
      expect(data.examples.length).toBeGreaterThan(0);
      for (const ex of data.examples) {
        expect(ex).toHaveProperty("sourceProduct");
        expect(Array.isArray(ex.recommend)).toBe(true);
      }
    });

    it("has adminRules array", () => {
      const data = getRecEngineV2Data();
      expect(Array.isArray(data.adminRules)).toBe(true);
    });
  });

  // ==================== Comparison Pages ====================
  describe("getComparisonData", () => {
    it("has comparisons array", () => {
      const data = getComparisonData();
      expect(data).toHaveProperty("comparisons");
      expect(Array.isArray(data.comparisons)).toBe(true);
      expect(data.comparisons.length).toBeGreaterThanOrEqual(3);
    });

    it("each comparison has slug, title, items, sections", () => {
      const data = getComparisonData();
      for (const c of data.comparisons) {
        expect(c).toHaveProperty("slug");
        expect(c).toHaveProperty("title");
        expect(Array.isArray(c.items)).toBe(true);
        expect(Array.isArray(c.sections)).toBe(true);
      }
    });
  });

  describe("getComparisonBySlug", () => {
    it("returns correct comparison for known slug", () => {
      const result = getComparisonBySlug("quick-fix-vs-bundle");
      expect(result).toBeDefined();
      expect(result!.title).toMatch(/Quick Fix/);
    });

    it("returns undefined for bad slug", () => {
      const result = getComparisonBySlug("nonexistent-slug-12345");
      expect(result).toBeUndefined();
    });
  });

  // ==================== Package Ladders ====================
  describe("getPackageLadders", () => {
    it("returns array of ladders", () => {
      const ladders = getPackageLadders();
      expect(Array.isArray(ladders)).toBe(true);
      expect(ladders.length).toBeGreaterThanOrEqual(4);
    });

    it("each ladder has category, good, better, best", () => {
      const ladders = getPackageLadders();
      for (const l of ladders) {
        expect(l).toHaveProperty("category");
        expect(l).toHaveProperty("good");
        expect(l).toHaveProperty("better");
        expect(l).toHaveProperty("best");
      }
    });
  });

  describe("getPackageLadderForCategory", () => {
    it("returns ladder for known category", () => {
      const result = getPackageLadderForCategory("Cybersecurity");
      expect(result).toBeDefined();
      expect(result!.category).toBe("Cybersecurity");
    });

    it("returns undefined for unknown category", () => {
      const result = getPackageLadderForCategory("UnknownCategory");
      expect(result).toBeUndefined();
    });
  });

  // ==================== Proposal Generator ====================
  describe("getProposalData", () => {
    it("has fields array", () => {
      const data = getProposalData();
      expect(data).toHaveProperty("fields");
      expect(Array.isArray(data.fields)).toBe(true);
      expect(data.fields.length).toBeGreaterThan(0);
    });

    it("includes common proposal fields", () => {
      const data = getProposalData();
      expect(data.fields).toContain("Executive summary");
    });
  });

  // ==================== Intake to Project ====================
  describe("getIntakeToProjectData", () => {
    it("has entities array", () => {
      const data = getIntakeToProjectData();
      expect(data).toHaveProperty("entities");
      expect(Array.isArray(data.entities)).toBe(true);
      expect(data.entities.length).toBeGreaterThanOrEqual(9);
    });

    it("has version string", () => {
      const data = getIntakeToProjectData();
      expect(typeof data.version).toBe("string");
    });
  });

  // ==================== Lifecycle States ====================
  describe("getLifecycleStates", () => {
    it("returns array of strings", () => {
      const states = getLifecycleStates();
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
    });

    it("includes draft and published", () => {
      const states = getLifecycleStates();
      expect(states).toContain("draft");
      expect(states).toContain("published");
    });
  });

  // ==================== Content Quality Auditor ====================
  describe("getContentQualityAuditorData", () => {
    it("has dimensions array", () => {
      const data = getContentQualityAuditorData();
      expect(data).toHaveProperty("dimensions");
      expect(Array.isArray(data.dimensions)).toBe(true);
      expect(data.dimensions.length).toBeGreaterThan(0);
    });

    it("each dimension has id and label", () => {
      const data = getContentQualityAuditorData();
      for (const d of data.dimensions) {
        expect(d).toHaveProperty("id");
        expect(d).toHaveProperty("label");
      }
    });
  });

  // ==================== SEO Landing Pages ====================
  describe("getSEOLandingPages", () => {
    it("returns array of pages", () => {
      const pages = getSEOLandingPages();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThanOrEqual(3);
    });

    it("each page has slug and title", () => {
      const pages = getSEOLandingPages();
      for (const p of pages) {
        expect(p).toHaveProperty("slug");
        expect(p).toHaveProperty("title");
      }
    });
  });

  // ==================== FAQ System ====================
  describe("getFAQData", () => {
    it("has faqs array", () => {
      const data = getFAQData();
      expect(data).toHaveProperty("faqs");
      expect(Array.isArray(data.faqs)).toBe(true);
      expect(data.faqs.length).toBeGreaterThan(0);
    });

    it("each faq has question and answer", () => {
      const data = getFAQData();
      for (const f of data.faqs) {
        expect(f).toHaveProperty("question");
        expect(f).toHaveProperty("answer");
      }
    });
  });

  describe("getFAQsForProduct", () => {
    it("returns FAQs for known product", () => {
      const result = getFAQsForProduct("admin_access");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==================== Testimonials ====================
  describe("getTestimonials", () => {
    it("returns array", () => {
      const result = getTestimonials();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getApprovedTestimonials", () => {
    it("filters properly — all returned are approved", () => {
      const result = getApprovedTestimonials();
      expect(Array.isArray(result)).toBe(true);
      for (const t of result) {
        expect(t.approved).toBe(true);
      }
    });
  });

  // ==================== Case Studies ====================
  describe("getCaseStudies", () => {
    it("returns array", () => {
      const result = getCaseStudies();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getApprovedCaseStudies", () => {
    it("filters properly — all returned are approved", () => {
      const result = getApprovedCaseStudies();
      expect(Array.isArray(result)).toBe(true);
      for (const cs of result) {
        expect(cs.approved).toBe(true);
      }
    });
  });

  describe("getCaseStudyBySlug", () => {
    it("returns undefined for non-existent slug", () => {
      const result = getCaseStudyBySlug("nonexistent-case-study");
      expect(result).toBeUndefined();
    });
  });

  // ==================== Email Nurture ====================
  describe("getEmailNurtureData", () => {
    it("has sequences array", () => {
      const data = getEmailNurtureData();
      expect(data).toHaveProperty("sequences");
      expect(Array.isArray(data.sequences)).toBe(true);
      expect(data.sequences.length).toBeGreaterThan(0);
    });

    it("each sequence has id, name, and steps", () => {
      const data = getEmailNurtureData();
      for (const s of data.sequences) {
        expect(s).toHaveProperty("id");
        expect(s).toHaveProperty("name");
        expect(Array.isArray(s.steps)).toBe(true);
        expect(s.steps.length).toBeGreaterThan(0);
      }
    });

    it("each step has subject, body, and delayDays", () => {
      const data = getEmailNurtureData();
      for (const s of data.sequences) {
        for (const step of s.steps) {
          expect(step).toHaveProperty("subject");
          expect(step).toHaveProperty("body");
          expect(typeof step.delayDays).toBe("number");
        }
      }
    });
  });

  // ==================== Portal Service Hub ====================
  describe("getPortalServiceHubData", () => {
    it("has sections array", () => {
      const data = getPortalServiceHubData();
      expect(data).toHaveProperty("sections");
      expect(Array.isArray(data.sections)).toBe(true);
      expect(data.sections.length).toBeGreaterThan(0);
    });

    it("includes common portal sections", () => {
      const data = getPortalServiceHubData();
      expect(data.sections).toContain("Requested services");
    });

    it("has statuses array", () => {
      const data = getPortalServiceHubData();
      expect(Array.isArray(data.statuses)).toBe(true);
    });
  });

  // ==================== Fulfillment Checklists ====================
  describe("getFulfillmentChecklists", () => {
    it("returns array of checklists", () => {
      const result = getFulfillmentChecklists();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("each checklist has productId and tasks", () => {
      const result = getFulfillmentChecklists();
      for (const c of result) {
        expect(c).toHaveProperty("productId");
        expect(Array.isArray(c.tasks)).toBe(true);
        expect(c.tasks.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getChecklistForProduct", () => {
    it("returns checklist for known product", () => {
      const result = getChecklistForProduct("general");
      expect(result).toBeDefined();
    });

    it("returns undefined for unknown product", () => {
      const result = getChecklistForProduct("unknown_product_12345");
      expect(result).toBeUndefined();
    });
  });

  // ==================== Profitability ====================
  describe("getProfitabilityData", () => {
    it("has dimensions array", () => {
      const data = getProfitabilityData();
      expect(data).toHaveProperty("dimensions");
      expect(Array.isArray(data.dimensions)).toBe(true);
      expect(data.dimensions.length).toBeGreaterThan(0);
    });

    it("each dimension has id, label, and weight", () => {
      const data = getProfitabilityData();
      for (const d of data.dimensions) {
        expect(d).toHaveProperty("id");
        expect(d).toHaveProperty("label");
        expect(typeof d.weight).toBe("number");
      }
    });
  });

  // ==================== Dependency Engine ====================
  describe("getDependencyEngineData", () => {
    it("has dependencies array", () => {
      const data = getDependencyEngineData();
      expect(data).toHaveProperty("dependencies");
      expect(Array.isArray(data.dependencies)).toBe(true);
      expect(data.dependencies.length).toBeGreaterThan(0);
    });

    it("each dependency has productId, requires, recommends, severity", () => {
      const data = getDependencyEngineData();
      for (const d of data.dependencies) {
        expect(d).toHaveProperty("productId");
        expect(Array.isArray(d.requires)).toBe(true);
        expect(Array.isArray(d.recommends)).toBe(true);
        expect(["required", "recommended"]).toContain(d.severity);
      }
    });
  });

  describe("getDependenciesForProduct", () => {
    it("returns dependency for known product", () => {
      const result = getDependenciesForProduct("unifi_camera_install");
      expect(result).toBeDefined();
      expect(Array.isArray(result!.requires)).toBe(true);
    });

    it("returns undefined for unknown product", () => {
      const result = getDependenciesForProduct("unknown_product_xyz");
      expect(result).toBeUndefined();
    });
  });

  // ==================== Lead Magnets ====================
  describe("getLeadMagnets", () => {
    it("returns array of magnets", () => {
      const magnets = getLeadMagnets();
      expect(Array.isArray(magnets)).toBe(true);
      expect(magnets.length).toBeGreaterThanOrEqual(8);
    });

    it("each magnet has id, title, slug", () => {
      const magnets = getLeadMagnets();
      for (const m of magnets) {
        expect(m).toHaveProperty("id");
        expect(m).toHaveProperty("title");
        expect(m).toHaveProperty("slug");
      }
    });
  });

  describe("getLeadMagnetBySlug", () => {
    it("returns correct magnet for known slug", () => {
      const result = getLeadMagnetBySlug("cyber_insurance_readiness_checklist");
      expect(result).toBeDefined();
      expect(result!.slug).toBe("cyber_insurance_readiness_checklist");
    });

    it("returns undefined for unknown slug", () => {
      const result = getLeadMagnetBySlug("nonexistent-magnet");
      expect(result).toBeUndefined();
    });
  });
});
