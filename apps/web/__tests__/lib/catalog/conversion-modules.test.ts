import {
  getPromoRules,
  getTrustBadges,
  getVisualServiceMap,
  getActiveCampaigns,
  getServiceFinderQuiz,
  getBundleSavingsCalculator,
  getQuizQuestions,
  getBundleValuePanels,
} from "@/lib/catalog/loader";

describe("getPromoRules", () => {
  it("returns valid data with principles", () => {
    const data = getPromoRules();
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("principles");
    expect(Array.isArray(data.principles)).toBe(true);
    expect(data.principles.length).toBeGreaterThan(0);
    expect(data.principles).toContain("Truthful discounts only");
  });

  it("has promotionTypes array", () => {
    const data = getPromoRules();
    expect(Array.isArray(data.promotionTypes)).toBe(true);
    expect(data.promotionTypes.length).toBeGreaterThanOrEqual(6);
  });

  it("has displayPatterns array", () => {
    const data = getPromoRules();
    expect(Array.isArray(data.displayPatterns)).toBe(true);
    expect(data.displayPatterns.length).toBeGreaterThanOrEqual(4);
  });

  it("has guardrails with disallowed and required", () => {
    const data = getPromoRules();
    expect(data.guardrails).toHaveProperty("disallowed");
    expect(data.guardrails).toHaveProperty("required");
    expect(Array.isArray(data.guardrails.disallowed)).toBe(true);
    expect(data.guardrails.disallowed).toContain("Fake countdown timers");
  });
});

describe("getTrustBadges", () => {
  it("returns at least the 6 defined badges", () => {
    const data = getTrustBadges();
    expect(data).toHaveProperty("badges");
    expect(Array.isArray(data.badges)).toBe(true);
    expect(data.badges.length).toBeGreaterThanOrEqual(6);
  });

  it("includes no_secret_intake badge", () => {
    const data = getTrustBadges();
    const ids = data.badges.map((b) => b.id);
    expect(ids).toContain("no_secret_intake");
  });

  it("includes local_maine_support badge", () => {
    const data = getTrustBadges();
    const ids = data.badges.map((b) => b.id);
    expect(ids).toContain("local_maine_support");
  });

  it("has placementRules array", () => {
    const data = getTrustBadges();
    expect(Array.isArray(data.placementRules)).toBe(true);
    expect(data.placementRules.length).toBeGreaterThan(0);
  });
});

describe("getVisualServiceMap", () => {
  it("returns 12 category visuals", () => {
    const data = getVisualServiceMap();
    expect(data).toHaveProperty("categoryVisuals");
    expect(Array.isArray(data.categoryVisuals)).toBe(true);
    expect(data.categoryVisuals).toHaveLength(12);
  });

  it("each visual has category, icon, and imagePrompt", () => {
    const data = getVisualServiceMap();
    for (const visual of data.categoryVisuals) {
      expect(visual).toHaveProperty("category");
      expect(visual).toHaveProperty("icon");
      expect(visual).toHaveProperty("imagePrompt");
    }
  });

  it("has icon library recommendation", () => {
    const data = getVisualServiceMap();
    expect(data.iconLibraryRecommendation).toBe("lucide-react");
  });
});

describe("getActiveCampaigns", () => {
  it("returns all 5 campaigns", () => {
    const campaigns = getActiveCampaigns();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns).toHaveLength(5);
  });

  it("each campaign has required fields", () => {
    const campaigns = getActiveCampaigns();
    for (const c of campaigns) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("name");
      expect(c).toHaveProperty("audience");
      expect(c).toHaveProperty("headline");
      expect(Array.isArray(c.recommendedProducts)).toBe(true);
      expect(Array.isArray(c.trustBadges)).toBe(true);
      expect(c).toHaveProperty("visual");
      expect(c.visual).toHaveProperty("icon");
      expect(c.visual).toHaveProperty("accent");
    }
  });
});

describe("getServiceFinderQuiz", () => {
  it("has questions and recommendationMap", () => {
    const quiz = getServiceFinderQuiz();
    expect(quiz).toHaveProperty("questions");
    expect(quiz).toHaveProperty("recommendationMap");
    expect(Array.isArray(quiz.questions)).toBe(true);
    expect(Array.isArray(quiz.recommendationMap)).toBe(true);
  });

  it("has emergencyOverride", () => {
    const quiz = getServiceFinderQuiz();
    expect(quiz).toHaveProperty("emergencyOverride");
    expect(quiz.emergencyOverride.quickWin).toBe("emergency_remote_support");
  });
});

describe("getBundleSavingsCalculator", () => {
  it("has calculation modes", () => {
    const calc = getBundleSavingsCalculator();
    expect(calc).toHaveProperty("calculationModes");
    expect(Array.isArray(calc.calculationModes)).toBe(true);
    expect(calc.calculationModes.length).toBeGreaterThanOrEqual(4);
  });

  it("has fields array", () => {
    const calc = getBundleSavingsCalculator();
    expect(Array.isArray(calc.fields)).toBe(true);
    expect(calc.fields.length).toBeGreaterThan(0);
  });

  it("has displayRules object", () => {
    const calc = getBundleSavingsCalculator();
    expect(typeof calc.displayRules).toBe("object");
    expect(calc.displayRules).toHaveProperty("exact");
  });
});

describe("getQuizQuestions", () => {
  it("returns 6 questions", () => {
    const questions = getQuizQuestions();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions).toHaveLength(6);
  });

  it("each question has id, label, type, options", () => {
    const questions = getQuizQuestions();
    for (const q of questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("label");
      expect(q).toHaveProperty("type");
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThan(0);
    }
  });

  it("first question has 6 options", () => {
    const questions = getQuizQuestions();
    expect(questions[0].options).toHaveLength(6);
  });
});

describe("getBundleValuePanels", () => {
  it("returns at least 1 panel", () => {
    const panels = getBundleValuePanels();
    expect(Array.isArray(panels)).toBe(true);
    expect(panels.length).toBeGreaterThanOrEqual(1);
  });

  it("each panel has bundleId, includedValueText, assumptions, disclaimer", () => {
    const panels = getBundleValuePanels();
    for (const p of panels) {
      expect(p).toHaveProperty("bundleId");
      expect(p).toHaveProperty("includedValueText");
      expect(Array.isArray(p.assumptions)).toBe(true);
      expect(typeof p.disclaimer).toBe("string");
    }
  });
});
