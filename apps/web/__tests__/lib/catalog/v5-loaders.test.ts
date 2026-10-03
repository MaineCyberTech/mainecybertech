import {
  getAnalyticsEventNames,
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

describe("getAnalyticsEventNames", () => {
  it("returns event name array", () => {
    const names = getAnalyticsEventNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain("store_view");
    expect(names).toContain("product_cta_click");
    expect(names).toContain("quote_submit");
  });
});

describe("getLeadScoringData", () => {
  it("has score bands and rules", () => {
    const data = getLeadScoringData();
    expect(data).toHaveProperty("scoreBands");
    expect(data).toHaveProperty("rules");
    expect(data).toHaveProperty("statuses");
    expect(data).toHaveProperty("adminFields");
    expect(Array.isArray(data.scoreBands)).toBe(true);
    expect(data.scoreBands.length).toBeGreaterThanOrEqual(4);
    expect(Array.isArray(data.rules)).toBe(true);
    expect(data.rules.length).toBeGreaterThanOrEqual(8);
  });

  it("each rule has points", () => {
    const data = getLeadScoringData();
    for (const rule of data.rules) {
      expect(rule).toHaveProperty("id");
      expect(rule).toHaveProperty("points");
      expect(typeof rule.points).toBe("number");
    }
  });
});

describe("getRecEngineV2Data", () => {
  it("has recommendation types", () => {
    const data = getRecEngineV2Data();
    expect(data).toHaveProperty("recommendationTypes");
    expect(Array.isArray(data.recommendationTypes)).toBe(true);
    expect(data.recommendationTypes.length).toBeGreaterThanOrEqual(9);
    expect(data.recommendationTypes).toContain("frequently_paired");
  });

  it("has examples array", () => {
    const data = getRecEngineV2Data();
    expect(Array.isArray(data.examples)).toBe(true);
    expect(data.examples.length).toBeGreaterThan(0);
    for (const ex of data.examples) {
      expect(ex).toHaveProperty("sourceProduct");
      expect(Array.isArray(ex.recommend)).toBe(true);
    }
  });
});

describe("getComparisonData", () => {
  it("has comparisons", () => {
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
  it("returns a valid comparison", () => {
    const result = getComparisonBySlug("quick-fix-vs-bundle");
    expect(result).toBeDefined();
    expect(result!.title).toMatch(/Quick Fix/);
  });

  it("returns undefined for invalid slug", () => {
    const result = getComparisonBySlug("nonexistent-comparison");
    expect(result).toBeUndefined();
  });
});

describe("getPackageLadders", () => {
  it("returns ladder array", () => {
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
    expect(result!.good).toBe("mfa_setup_session");
    expect(result!.best).toBe("mct_secure_care");
  });

  it("returns undefined for unknown category", () => {
    const result = getPackageLadderForCategory("UnknownCategory");
    expect(result).toBeUndefined();
  });
});

describe("getProposalData", () => {
  it("has fields", () => {
    const data = getProposalData();
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("fields");
    expect(Array.isArray(data.fields)).toBe(true);
    expect(data.fields.length).toBeGreaterThan(0);
    expect(data.fields).toContain("Executive summary");
  });
});

describe("getIntakeToProjectData", () => {
  it("has entities", () => {
    const data = getIntakeToProjectData();
    expect(data).toHaveProperty("entities");
    expect(Array.isArray(data.entities)).toBe(true);
    expect(data.entities.length).toBeGreaterThanOrEqual(9);
  });
});

describe("getLifecycleStates", () => {
  it("returns array", () => {
    const states = getLifecycleStates();
    expect(Array.isArray(states)).toBe(true);
    expect(states.length).toBeGreaterThanOrEqual(8);
    expect(states).toContain("draft");
    expect(states).toContain("published");
  });
});

describe("getContentQualityAuditorData", () => {
  it("has dimensions", () => {
    const data = getContentQualityAuditorData();
    expect(data).toHaveProperty("dimensions");
    expect(Array.isArray(data.dimensions)).toBe(true);
    expect(data.dimensions.length).toBeGreaterThanOrEqual(13);
  });

  it("each dimension has id and label", () => {
    const data = getContentQualityAuditorData();
    for (const d of data.dimensions) {
      expect(d).toHaveProperty("id");
      expect(d).toHaveProperty("label");
    }
  });
});

describe("getSEOLandingPages", () => {
  it("returns array", () => {
    const pages = getSEOLandingPages();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThanOrEqual(3);
  });
});

describe("getFAQData", () => {
  it("has FAQs", () => {
    const data = getFAQData();
    expect(data).toHaveProperty("faqs");
    expect(Array.isArray(data.faqs)).toBe(true);
    expect(data.faqs.length).toBeGreaterThanOrEqual(3);
  });

  it("each FAQ has question and answer", () => {
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

describe("getTestimonials", () => {
  it("returns array", () => {
    const result = getTestimonials();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getApprovedTestimonials", () => {
  it("filters by approved", () => {
    const result = getApprovedTestimonials();
    expect(Array.isArray(result)).toBe(true);
    for (const t of result) {
      expect(t.approved).toBe(true);
    }
  });
});

describe("getCaseStudies", () => {
  it("returns array", () => {
    const result = getCaseStudies();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("getApprovedCaseStudies", () => {
  it("filters by approved", () => {
    const result = getApprovedCaseStudies();
    expect(Array.isArray(result)).toBe(true);
    for (const cs of result) {
      expect(cs.approved).toBe(true);
    }
  });
});

describe("getCaseStudyBySlug", () => {
  it("returns matching case study", () => {
    const result = getCaseStudyBySlug("any-slug");
    expect(result).toBeUndefined();
  });
});

describe("getEmailNurtureData", () => {
  it("has sequences", () => {
    const data = getEmailNurtureData();
    expect(data).toHaveProperty("sequences");
    expect(Array.isArray(data.sequences)).toBe(true);
    expect(data.sequences.length).toBeGreaterThanOrEqual(3);
  });

  it("each sequence has id, name, steps", () => {
    const data = getEmailNurtureData();
    for (const s of data.sequences) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(Array.isArray(s.steps)).toBe(true);
      expect(s.steps.length).toBeGreaterThan(0);
    }
  });
});

describe("getPortalServiceHubData", () => {
  it("has sections", () => {
    const data = getPortalServiceHubData();
    expect(data).toHaveProperty("sections");
    expect(Array.isArray(data.sections)).toBe(true);
    expect(data.sections.length).toBeGreaterThanOrEqual(9);
    expect(data.sections).toContain("Requested services");
  });
});

describe("getFulfillmentChecklists", () => {
  it("returns array", () => {
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
    expect(result!.tasks.length).toBeGreaterThanOrEqual(9);
  });

  it("returns undefined for unknown product", () => {
    const result = getChecklistForProduct("unknown_product");
    expect(result).toBeUndefined();
  });
});

describe("getProfitabilityData", () => {
  it("has dimensions", () => {
    const data = getProfitabilityData();
    expect(data).toHaveProperty("dimensions");
    expect(Array.isArray(data.dimensions)).toBe(true);
    expect(data.dimensions.length).toBeGreaterThanOrEqual(12);
  });

  it("each dimension has id, label, weight", () => {
    const data = getProfitabilityData();
    for (const d of data.dimensions) {
      expect(d).toHaveProperty("id");
      expect(d).toHaveProperty("label");
      expect(d).toHaveProperty("weight");
    }
  });
});

describe("getDependencyEngineData", () => {
  it("has dependencies", () => {
    const data = getDependencyEngineData();
    expect(data).toHaveProperty("dependencies");
    expect(Array.isArray(data.dependencies)).toBe(true);
    expect(data.dependencies.length).toBeGreaterThanOrEqual(5);
  });

  it("each dependency has productId and severity", () => {
    const data = getDependencyEngineData();
    for (const d of data.dependencies) {
      expect(d).toHaveProperty("productId");
      expect(d).toHaveProperty("requires");
      expect(d).toHaveProperty("recommends");
      expect(["required", "recommended"]).toContain(d.severity);
    }
  });
});

describe("getDependenciesForProduct", () => {
  it("returns dependency for known product", () => {
    const result = getDependenciesForProduct("unifi_camera_install");
    expect(result).toBeDefined();
    expect(result!.requires).toContain("camera_network_readiness_check");
  });

  it("returns undefined for unknown product", () => {
    const result = getDependenciesForProduct("unknown_product");
    expect(result).toBeUndefined();
  });
});

describe("getLeadMagnets", () => {
  it("returns array", () => {
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
  it("returns matching magnet", () => {
    const result = getLeadMagnetBySlug("cyber_insurance_readiness_checklist");
    expect(result).toBeDefined();
    expect(result!.title).toMatch(/Cyber Insurance/);
  });

  it("returns undefined for unknown slug", () => {
    const result = getLeadMagnetBySlug("nonexistent-magnet");
    expect(result).toBeUndefined();
  });
});
